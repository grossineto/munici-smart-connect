import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = 'https://iibhnjdyteqblzrfiyah.supabase.co';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface WhatsAppMessage {
  id: string;
  from: string;
  text?: { body: string };
  type: string;
  timestamp: string;
}

interface WhatsAppWebhook {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: { phone_number_id: string };
        messages?: WhatsAppMessage[];
        statuses?: any[];
      };
      field: string;
    }>;
  }>;
}

// Menu principal do bot
const MAIN_MENU = `🏛️ *Prefeitura Municipal - Atendimento Digital*

Olá! Como posso ajudá-lo hoje?

*[1]* 📝 Registrar uma solicitação
*[2]* 📅 Agendar uma consulta
*[3]* 📋 Acompanhar protocolo
*[4]* 💬 Falar com a prefeitura

Digite o número da opção desejada.`;

// Tipos de solicitação
const REQUEST_TYPES = `📝 *Tipos de Solicitação*

*[1]* 🚧 Manutenção (buracos, calçadas)
*[2]* 🧹 Limpeza urbana
*[3]* 💡 Iluminação pública
*[4]* 🚌 Transporte público
*[5]* 🏥 Saúde
*[6]* 📚 Educação
*[7]* ❓ Outros

Digite o número correspondente ao tipo de problema.`;

async function sendWhatsAppMessage(phone: string, message: string) {
  const whatsappToken = Deno.env.get('WHATSAPP_TOKEN');
  const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
  
  if (!whatsappToken || !phoneNumberId) {
    console.error('WhatsApp credentials not configured');
    return;
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: message }
      }),
    });

    if (!response.ok) {
      console.error('Failed to send WhatsApp message:', await response.text());
    }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
  }
}

async function getOrCreateCitizen(phone: string) {
  // Verificar se já existe um cidadão com este número
  const { data: citizen, error } = await supabase
    .from('citizens')
    .select('*')
    .eq('whatsapp_phone', phone)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching citizen:', error);
    return null;
  }

  return citizen;
}

async function createCitizen(phone: string, name: string, cpf?: string) {
  const { data, error } = await supabase
    .from('citizens')
    .insert({
      name,
      phone,
      whatsapp_phone: phone,
      cpf,
      registration_step: 'completed'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating citizen:', error);
    return null;
  }

  return data;
}

async function getSession(phone: string) {
  const { data, error } = await supabase
    .from('whatsapp_sessions')
    .select('*')
    .eq('phone', phone)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching session:', error);
  }

  return data;
}

async function updateSession(phone: string, updates: any) {
  const { error } = await supabase
    .from('whatsapp_sessions')
    .upsert({
      phone,
      ...updates,
      last_activity: new Date().toISOString()
    });

  if (error) {
    console.error('Error updating session:', error);
  }
}

async function saveMessage(phone: string, content: string, isFromCitizen = true, requestId?: string) {
  const { error } = await supabase
    .from('messages')
    .insert({
      sender_phone: phone,
      content,
      is_from_citizen: isFromCitizen,
      request_id: requestId,
      message_type: 'text'
    });

  if (error) {
    console.error('Error saving message:', error);
  }
}

async function processMessage(phone: string, message: string) {
  console.log(`Processing message from ${phone}: ${message}`);
  
  // Salvar mensagem do usuário
  await saveMessage(phone, message, true);
  
  // Verificar se é o primeiro acesso
  let citizen = await getOrCreateCitizen(phone);
  let session = await getSession(phone);
  
  // Se não há sessão, criar uma nova
  if (!session) {
    await updateSession(phone, {
      current_flow: 'initial',
      flow_data: {}
    });
    session = await getSession(phone);
  }
  
  const messageText = message.toLowerCase().trim();
  
  // Fluxo inicial - primeiro acesso
  if (!citizen && session?.current_flow === 'initial') {
    if (session.flow_data?.waiting_for_name) {
      // Usuário enviou o nome
      await updateSession(phone, {
        current_flow: 'registration',
        flow_data: { name: message, waiting_for_cpf: true }
      });
      
      const response = `Obrigado, ${message}! 

Agora, por favor, digite seu *CPF* (apenas números) para completar o cadastro:`;
      
      await sendWhatsAppMessage(phone, response);
      await saveMessage(phone, response, false);
      return;
    }
    
    if (session.flow_data?.waiting_for_cpf) {
      // Usuário enviou o CPF
      const name = session.flow_data?.name;
      const cpf = message.replace(/\D/g, ''); // Remove caracteres não numéricos
      
      // Criar cidadão
      citizen = await createCitizen(phone, name, cpf);
      
      await updateSession(phone, {
        current_flow: 'menu',
        flow_data: {},
        citizen_id: citizen?.id
      });
      
      const response = `✅ Cadastro realizado com sucesso!

${MAIN_MENU}`;
      
      await sendWhatsAppMessage(phone, response);
      await saveMessage(phone, response, false);
      return;
    }
    
    // Primeira mensagem - solicitar nome
    await updateSession(phone, {
      current_flow: 'initial',
      flow_data: { waiting_for_name: true }
    });
    
    const welcomeMessage = `🏛️ *Bem-vindo ao Atendimento Digital da Prefeitura!*

Para começar, preciso conhecê-lo melhor.

Por favor, digite seu *nome completo*:`;
    
    await sendWhatsAppMessage(phone, welcomeMessage);
    await saveMessage(phone, welcomeMessage, false);
    return;
  }
  
  // Menu principal
  if (session?.current_flow === 'menu' || messageText === 'menu' || messageText === '0') {
    await updateSession(phone, {
      current_flow: 'menu',
      flow_data: {}
    });
    
    await sendWhatsAppMessage(phone, MAIN_MENU);
    await saveMessage(phone, MAIN_MENU, false);
    return;
  }
  
  // Processar opções do menu principal
  if (session?.current_flow === 'menu') {
    switch (messageText) {
      case '1':
        await updateSession(phone, {
          current_flow: 'request_creation',
          flow_data: { step: 'type_selection' }
        });
        await sendWhatsAppMessage(phone, REQUEST_TYPES);
        await saveMessage(phone, REQUEST_TYPES, false);
        break;
        
      case '2':
        const appointmentMessage = `📅 *Agendamento de Consultas*

Esta funcionalidade estará disponível em breve.

Digite *0* para voltar ao menu principal.`;
        await sendWhatsAppMessage(phone, appointmentMessage);
        await saveMessage(phone, appointmentMessage, false);
        break;
        
      case '3':
        await updateSession(phone, {
          current_flow: 'protocol_check',
          flow_data: { waiting_for_protocol: true }
        });
        
        const protocolMessage = `📋 *Consulta de Protocolo*

Digite o número do protocolo que deseja consultar:

Exemplo: BR2024001`;
        
        await sendWhatsAppMessage(phone, protocolMessage);
        await saveMessage(phone, protocolMessage, false);
        break;
        
      case '4':
        await updateSession(phone, {
          current_flow: 'free_message',
          flow_data: { waiting_for_message: true }
        });
        
        const freeMessage = `💬 *Fale com a Prefeitura*

Digite sua mensagem que será encaminhada para o atendimento:`;
        
        await sendWhatsAppMessage(phone, freeMessage);
        await saveMessage(phone, freeMessage, false);
        break;
        
      default:
        const invalidMessage = `❌ Opção inválida.

${MAIN_MENU}`;
        await sendWhatsAppMessage(phone, invalidMessage);
        await saveMessage(phone, invalidMessage, false);
    }
    return;
  }
  
  // Fluxo de criação de solicitação
  if (session?.current_flow === 'request_creation') {
    if (session.flow_data?.step === 'type_selection') {
      const typeMap: { [key: string]: string } = {
        '1': 'manutencao',
        '2': 'limpeza',
        '3': 'iluminacao',
        '4': 'transporte',
        '5': 'saude',
        '6': 'educacao',
        '7': 'outros'
      };
      
      const selectedType = typeMap[messageText];
      if (selectedType) {
        await updateSession(phone, {
          current_flow: 'request_creation',
          flow_data: { 
            step: 'description',
            type: selectedType,
            type_label: getTypeLabel(selectedType)
          }
        });
        
        const descriptionMessage = `📝 *Descreva o problema*

Você selecionou: *${getTypeLabel(selectedType)}*

Agora descreva detalhadamente o problema que você está enfrentando:`;
        
        await sendWhatsAppMessage(phone, descriptionMessage);
        await saveMessage(phone, descriptionMessage, false);
      } else {
        await sendWhatsAppMessage(phone, `❌ Opção inválida.

${REQUEST_TYPES}`);
      }
      return;
    }
    
    if (session.flow_data?.step === 'description') {
      await updateSession(phone, {
        current_flow: 'request_creation',
        flow_data: {
          ...session.flow_data,
          step: 'location',
          description: message
        }
      });
      
      const locationMessage = `📍 *Localização do problema*

Informe o endereço ou uma referência de onde está o problema:

Exemplo: Rua das Flores, 123 - Centro`;
      
      await sendWhatsAppMessage(phone, locationMessage);
      await saveMessage(phone, locationMessage, false);
      return;
    }
    
    if (session.flow_data?.step === 'location') {
      // Criar a solicitação
      const { data: request, error } = await supabase
        .from('requests')
        .insert({
          citizen_id: citizen?.id,
          type: session.flow_data.type,
          title: `${session.flow_data.type_label} - ${phone}`,
          description: session.flow_data.description,
          location: message,
          priority: 'medium'
        })
        .select('protocol_number')
        .single();
      
      if (error) {
        console.error('Error creating request:', error);
        await sendWhatsAppMessage(phone, '❌ Erro ao criar solicitação. Tente novamente.');
        return;
      }
      
      await updateSession(phone, {
        current_flow: 'menu',
        flow_data: {}
      });
      
      const successMessage = `✅ *Solicitação criada com sucesso!*

📋 *Protocolo:* ${request.protocol_number}
📝 *Tipo:* ${session.flow_data.type_label}
📍 *Local:* ${message}

Sua solicitação foi registrada e será analisada pela equipe responsável. 

Você receberá atualizações sobre o andamento.

${MAIN_MENU}`;
      
      await sendWhatsAppMessage(phone, successMessage);
      await saveMessage(phone, successMessage, false);
      return;
    }
  }
  
  // Consulta de protocolo
  if (session?.current_flow === 'protocol_check' && session.flow_data?.waiting_for_protocol) {
    const { data: request, error } = await supabase
      .from('requests')
      .select('*')
      .eq('protocol_number', message.toUpperCase())
      .single();
    
    if (error || !request) {
      const notFoundMessage = `❌ Protocolo não encontrado.

Verifique se digitou corretamente e tente novamente, ou digite *0* para voltar ao menu principal.`;
      
      await sendWhatsAppMessage(phone, notFoundMessage);
      await saveMessage(phone, notFoundMessage, false);
      return;
    }
    
    const statusMap: { [key: string]: string } = {
      'pending': '⏳ Pendente',
      'in_progress': '🔄 Em Andamento',
      'completed': '✅ Concluída',
      'cancelled': '❌ Cancelada'
    };
    
    await updateSession(phone, {
      current_flow: 'menu',
      flow_data: {}
    });
    
    const statusMessage = `📋 *Status da Solicitação*

🔍 *Protocolo:* ${request.protocol_number}
📝 *Tipo:* ${getTypeLabel(request.type)}
📊 *Status:* ${statusMap[request.status] || request.status}
📅 *Criado em:* ${new Date(request.created_at).toLocaleDateString('pt-BR')}

${MAIN_MENU}`;
    
    await sendWhatsAppMessage(phone, statusMessage);
    await saveMessage(phone, statusMessage, false);
    return;
  }
  
  // Mensagem livre
  if (session?.current_flow === 'free_message' && session.flow_data?.waiting_for_message) {
    // Criar solicitação como "outros" para mensagens livres
    const { data: request, error } = await supabase
      .from('requests')
      .insert({
        citizen_id: citizen?.id,
        type: 'outros',
        title: `Mensagem livre - ${phone}`,
        description: message,
        priority: 'medium'
      })
      .select('protocol_number')
      .single();
    
    await updateSession(phone, {
      current_flow: 'menu',
      flow_data: {}
    });
    
    const responseMessage = `✅ *Mensagem encaminhada com sucesso!*

📋 *Protocolo:* ${request?.protocol_number || 'N/A'}

Sua mensagem foi encaminhada para nossa equipe de atendimento e você receberá um retorno em breve.

${MAIN_MENU}`;
    
    await sendWhatsAppMessage(phone, responseMessage);
    await saveMessage(phone, responseMessage, false);
    return;
  }
  
  // Mensagem padrão para casos não tratados
  const defaultMessage = `🤖 Não entendi sua mensagem.

${MAIN_MENU}`;
  
  await sendWhatsAppMessage(phone, defaultMessage);
  await saveMessage(phone, defaultMessage, false);
}

function getTypeLabel(type: string): string {
  const types: { [key: string]: string } = {
    'manutencao': 'Manutenção',
    'limpeza': 'Limpeza',
    'iluminacao': 'Iluminação',
    'transporte': 'Transporte',
    'saude': 'Saúde',
    'educacao': 'Educação',
    'outros': 'Outros'
  };
  return types[type] || type;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Webhook verification (GET request)
    if (req.method === 'GET') {
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');
      
      const verifyToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN') || 'brian_verify_token';
      
      if (mode === 'subscribe' && token === verifyToken) {
        console.log('Webhook verified successfully');
        return new Response(challenge, { status: 200 });
      } else {
        console.log('Webhook verification failed');
        return new Response('Verification failed', { status: 403 });
      }
    }

    // Handle incoming messages (POST request)
    if (req.method === 'POST') {
      const body: WhatsAppWebhook = await req.json();
      
      console.log('Received webhook:', JSON.stringify(body, null, 2));
      
      if (body.object === 'whatsapp_business_account') {
        for (const entry of body.entry) {
          for (const change of entry.changes) {
            if (change.field === 'messages' && change.value.messages) {
              for (const message of change.value.messages) {
                if (message.type === 'text' && message.text) {
                  await processMessage(message.from, message.text.body);
                }
              }
            }
          }
        }
      }
      
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(`Webhook error: ${error.message}`, { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
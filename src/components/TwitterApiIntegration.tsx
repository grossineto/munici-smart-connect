import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TwitterUser {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
  description?: string;
  public_metrics?: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
  };
}

export interface TwitterTweet {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  public_metrics: {
    retweet_count: number;
    like_count: number;
    reply_count: number;
    quote_count: number;
  };
}

// Função para buscar informações de um político no Twitter
export async function searchTwitterUser(query: string): Promise<TwitterUser | null> {
  try {
    // Simular busca na API do Twitter para obter informações do usuário
    // Em uma implementação real, isso faria uma chamada para a API do Twitter
    
    const { data, error } = await supabase.functions.invoke('search-twitter-user', {
      body: { query }
    });

    if (error) {
      console.error('Erro ao buscar usuário no Twitter:', error);
      return null;
    }

    return data?.user || null;
  } catch (error) {
    console.error('Erro na busca do Twitter:', error);
    return null;
  }
}

// Função para coletar menções em tempo real
export async function collectTwitterMentions(politician: string, keywords: string[] = []) {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-twitter-mentions', {
      body: { 
        politicians: [
          {
            name: politician,
            keywords: keywords.length > 0 ? keywords : [politician]
          }
        ]
      }
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro ao coletar menções do Twitter:', error);
    throw error;
  }
}

// Função para auto-importar avatar do político
export async function importPoliticianAvatar(politicianName: string): Promise<string | null> {
  try {
    // Simular busca de avatar no Twitter
    const user = await searchTwitterUser(politicianName);
    
    if (user?.profile_image_url) {
      // Em uma implementação real, você baixaria a imagem e salvaria no storage
      return user.profile_image_url;
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao importar avatar:', error);
    return null;
  }
}

// Função para verificar se a API do Twitter está funcionando
export async function checkTwitterApiStatus(): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-twitter-mentions', {
      body: { 
        politicians: [{ name: "test", keywords: ["test"] }],
        test: true 
      }
    });

    return !error && data?.success;
  } catch (error) {
    console.error('Erro ao verificar status da API:', error);
    return false;
  }
}

// Hook para facilitar o uso da integração
export function useTwitterIntegration() {
  const searchUser = async (query: string) => {
    try {
      const user = await searchTwitterUser(query);
      return user;
    } catch (error) {
      toast.error("Erro ao buscar usuário no Twitter");
      return null;
    }
  };

  const collectMentions = async (politician: string, keywords: string[] = []) => {
    try {
      const result = await collectTwitterMentions(politician, keywords);
      toast.success("Menções coletadas com sucesso!");
      return result;
    } catch (error) {
      toast.error("Erro ao coletar menções do Twitter");
      throw error;
    }
  };

  const importAvatar = async (politicianName: string) => {
    try {
      const avatarUrl = await importPoliticianAvatar(politicianName);
      if (avatarUrl) {
        toast.success("Avatar importado automaticamente!");
      }
      return avatarUrl;
    } catch (error) {
      toast.error("Erro ao importar avatar do Twitter");
      return null;
    }
  };

  return {
    searchUser,
    collectMentions,
    importAvatar,
    checkApiStatus: checkTwitterApiStatus
  };
}
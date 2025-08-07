import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface Politician {
  id: string;
  nome: string;
  partido?: string;
  mandato?: string;
  cidade: string;
  uf: string;
  cargo?: string;
  avatar?: string;
  socialMonitoring: boolean;
  newsMonitoring: boolean;
  keywords?: string[];
}

// Lista inicial de políticos
const initialPoliticians: Politician[] = [
  {
    id: '1',
    nome: 'Ricardo Nunes',
    partido: 'MDB',
    mandato: '2021-2024',
    cidade: 'São Paulo',
    uf: 'SP',
    cargo: 'Prefeito',
    avatar: '/lovable-uploads/6f653b9a-a318-4b80-955c-4f7b4de6634c.png',
    socialMonitoring: true,
    newsMonitoring: true,
    keywords: ['Ricardo Nunes', 'prefeito SP', 'São Paulo']
  },
  {
    id: '2',
    nome: 'Eduardo Paes',
    partido: 'PSD',
    mandato: '2021-2024',
    cidade: 'Rio de Janeiro',
    uf: 'RJ',
    cargo: 'Prefeito',
    avatar: '/lovable-uploads/eceb707c-015a-4cb2-b488-493c9c6b5cac.png',
    socialMonitoring: true,
    newsMonitoring: true,
    keywords: ['Eduardo Paes', 'prefeito RJ', 'Rio de Janeiro']
  },
  {
    id: '3',
    nome: 'João Campos',
    partido: 'PSB',
    mandato: '2021-2024',
    cidade: 'Recife',
    uf: 'PE',
    cargo: 'Prefeito',
    avatar: '/lovable-uploads/990eb197-9e97-4050-9ad7-41f0539e7ba8.png',
    socialMonitoring: true,
    newsMonitoring: true,
    keywords: ['João Campos', 'prefeito Recife', 'Recife']
  },
  {
    id: '4',
    nome: 'José Sarto',
    partido: 'UNIÃO BRASIL',
    mandato: '2021-2024',
    cidade: 'Fortaleza',
    uf: 'CE',
    cargo: 'Prefeito',
    avatar: '/lovable-uploads/f6d35a9d-205a-4556-ac06-3f9fbd151298.png',
    socialMonitoring: true,
    newsMonitoring: true,
    keywords: ['José Sarto', 'prefeito Fortaleza', 'Fortaleza']
  },
  {
    id: '5',
    nome: 'Tarcísio Gomes de Freitas',
    partido: 'REPUBLICANOS',
    mandato: '2023-2026',
    cidade: 'São Paulo',
    uf: 'SP',
    cargo: 'Governador',
    avatar: '/lovable-uploads/9c090c37-0d6e-4699-9cc5-028de5640b9a.png',
    socialMonitoring: true,
    newsMonitoring: true,
    keywords: ['Tarcísio', 'Tarcísio Freitas', 'governador SP']
  },
  {
    id: '6',
    nome: 'Guto Issa',
    partido: 'PV',
    mandato: '2021-2024',
    cidade: 'São Roque',
    uf: 'SP',
    cargo: 'Prefeito',
    avatar: '/lovable-uploads/dc683cc5-b8bf-4311-9698-3337b29889e5.png',
    socialMonitoring: false,
    newsMonitoring: false,
    keywords: ['Guto Issa', 'prefeito São Roque']
  },
  {
    id: '7',
    nome: 'Suéllen Silva Rosim',
    partido: 'UNIÃO BRASIL',
    mandato: '2021-2024',
    cidade: 'Bauru',
    uf: 'SP',
    cargo: 'Prefeita',
    avatar: '/lovable-uploads/425f80f3-21ac-4eef-984d-ba432848be17.png',
    socialMonitoring: false,
    newsMonitoring: false,
    keywords: ['Suéllen Rosim', 'prefeita Bauru', 'Bauru']
  }
];

interface PoliticiansContextType {
  politicians: Politician[];
  updatePolitician: (politician: Politician) => void;
  addPolitician: (politician: Politician) => void;
  deletePolitician: (id: string) => void;
  toggleMonitoring: (id: string, type: 'social' | 'news') => void;
  getActivePoliticians: (type?: 'social' | 'news') => Politician[];
}

const PoliticiansContext = createContext<PoliticiansContextType | undefined>(undefined);

export const usePoliticians = () => {
  const context = useContext(PoliticiansContext);
  if (!context) {
    throw new Error('usePoliticians must be used within a PoliticiansProvider');
  }
  return context;
};

interface PoliticiansProviderProps {
  children: ReactNode;
}

export const PoliticiansProvider: React.FC<PoliticiansProviderProps> = ({ children }) => {
  // Carregar dados do localStorage na inicialização
  const loadPoliticians = (): Politician[] => {
    try {
      const stored = localStorage.getItem('politicians-data');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Erro ao carregar dados dos políticos:', error);
    }
    return initialPoliticians;
  };

  const [politicians, setPoliticians] = useState<Politician[]>(loadPoliticians);

  // Salvar automaticamente no localStorage sempre que os dados mudarem
  useEffect(() => {
    try {
      localStorage.setItem('politicians-data', JSON.stringify(politicians));
    } catch (error) {
      console.error('Erro ao salvar dados dos políticos:', error);
    }
  }, [politicians]);

  // Aplicar listas específicas de keywords (override único)
  useEffect(() => {
    const flagKey = 'keywords-applied-2025-08-07-v2';
    if (localStorage.getItem(flagKey)) return;

    const updates: Record<string, string[]> = {
      'Ricardo Nunes': [
        'Ricardo Nunes', 'Ricardo Nunes SP', 'prefeito Ricardo Nunes',
        'prefeito de São Paulo', 'prefeito SP', 'prefeitura de São Paulo', 'prefeitura SP',
        'gestão Ricardo Nunes', 'Nunes São Paulo', 'São Paulo', 'Sao Paulo', 'SP capital',
        'obras São Paulo', 'saúde São Paulo', 'educação São Paulo', 'segurança São Paulo',
        'transporte São Paulo', 'mobilidade SP', 'zeladoria SP', 'MDB São Paulo', 'MDB SP'
      ],
      'Eduardo Paes': [
        'Eduardo Paes', 'prefeito Eduardo Paes',
        'prefeito do Rio de Janeiro', 'prefeito Rio', 'prefeitura do Rio', 'prefeitura RJ',
        'gestão Eduardo Paes', 'Paes Rio', 'Rio de Janeiro', 'RJ capital',
        'obras Rio', 'saúde Rio', 'educação Rio', 'segurança Rio',
        'mobilidade Rio', 'BRT Rio', 'urbanismo Rio', 'PSD Rio', 'PSD RJ'
      ],
      'João Campos': [
        'João Campos', 'Joao Campos', 'prefeito João Campos',
        'prefeito do Recife', 'prefeito Recife', 'prefeitura do Recife', 'prefeitura Recife',
        'gestão João Campos', 'Campos Recife', 'Recife', 'Recife PE', 'PE capital',
        'obras Recife', 'saúde Recife', 'educação Recife', 'segurança Recife',
        'mobilidade Recife', 'PSB Recife', 'PSB PE', 'litoral Recife'
      ],
      'José Sarto': [
        'José Sarto', 'Jose Sarto', 'prefeito José Sarto',
        'prefeito de Fortaleza', 'prefeito Fortaleza', 'prefeitura de Fortaleza', 'prefeitura Fortaleza',
        'gestão José Sarto', 'Sarto Fortaleza', 'Fortaleza', 'Fortaleza CE', 'CE capital',
        'obras Fortaleza', 'saúde Fortaleza', 'educação Fortaleza', 'segurança Fortaleza',
        'mobilidade Fortaleza', 'União Brasil Fortaleza', 'União Brasil CE'
      ],
      'Tarcísio Gomes de Freitas': [
        'Tarcísio de Freitas', 'Tarcisio de Freitas', 'Tarcísio Gomes de Freitas', 'Tarcisio Gomes',
        'governador de São Paulo', 'governador SP', 'governo de SP', 'Governo SP',
        'Palácio dos Bandeirantes', 'gestão Tarcísio', 'São Paulo', 'SP',
        'infraestrutura SP', 'rodovias SP', 'concessões SP', 'segurança SP', 'educação SP', 'saúde SP',
        'Republicanos SP', 'Republicanos São Paulo', 'investimento SP', 'obras estaduais SP'
      ],
      'Guto Issa': [
        'Guto Issa', 'prefeito Guto Issa',
        'prefeito de São Roque', 'prefeito São Roque', 'prefeitura de São Roque', 'prefeitura São Roque',
        'gestão Guto Issa', 'Issa São Roque', 'São Roque', 'Sao Roque', 'São Roque SP',
        'obras São Roque', 'saúde São Roque', 'educação São Roque', 'segurança São Roque',
        'PV São Roque', 'Partido Verde São Roque', 'turismo São Roque'
      ],
      'Suéllen Silva Rosim': [
        'Suéllen Rosim', 'Suellen Rosim', 'prefeita Suéllen Rosim',
        'prefeita de Bauru', 'prefeita Bauru', 'prefeitura de Bauru', 'prefeitura Bauru',
        'gestão Suéllen', 'Rosim Bauru', 'Bauru', 'Bauru SP',
        'obras Bauru', 'saúde Bauru', 'educação Bauru', 'segurança Bauru',
        'mobilidade Bauru', 'União Brasil Bauru', 'União Brasil SP'
      ]
    };

    setPoliticians(prev => prev.map(p => updates[p.nome] ? { ...p, keywords: updates[p.nome] } : p));
    localStorage.setItem(flagKey, '1');
  }, []);

  const updatePolitician = (updatedPolitician: Politician) => {
    setPoliticians(prev => 
      prev.map(p => p.id === updatedPolitician.id ? updatedPolitician : p)
    );
  };

  const addPolitician = (newPolitician: Politician) => {
    setPoliticians(prev => [...prev, newPolitician]);
  };

  const deletePolitician = (id: string) => {
    setPoliticians(prev => prev.filter(p => p.id !== id));
  };

  const toggleMonitoring = (id: string, type: 'social' | 'news') => {
    setPoliticians(prev =>
      prev.map(p => {
        if (p.id === id) {
          return {
            ...p,
            [type === 'social' ? 'socialMonitoring' : 'newsMonitoring']: 
              !p[type === 'social' ? 'socialMonitoring' : 'newsMonitoring']
          };
        }
        return p;
      })
    );
  };

  const getActivePoliticians = (type?: 'social' | 'news') => {
    if (!type) {
      return politicians.filter(p => p.socialMonitoring || p.newsMonitoring);
    }
    return politicians.filter(p => 
      type === 'social' ? p.socialMonitoring : p.newsMonitoring
    );
  };

  const value: PoliticiansContextType = {
    politicians,
    updatePolitician,
    addPolitician,
    deletePolitician,
    toggleMonitoring,
    getActivePoliticians
  };

  return (
    <PoliticiansContext.Provider value={value}>
      {children}
    </PoliticiansContext.Provider>
  );
};
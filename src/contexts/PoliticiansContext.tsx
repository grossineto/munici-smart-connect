import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  const [politicians, setPoliticians] = useState<Politician[]>(initialPoliticians);

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
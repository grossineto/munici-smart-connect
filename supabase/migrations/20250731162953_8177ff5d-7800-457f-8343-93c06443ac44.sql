-- Create enum types
CREATE TYPE public.request_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.request_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.request_type AS ENUM ('manutencao', 'limpeza', 'iluminacao', 'transporte', 'saude', 'educacao', 'outros');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create citizens table
CREATE TABLE public.citizens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  cpf TEXT UNIQUE,
  address TEXT,
  neighborhood TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create requests table
CREATE TABLE public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_number TEXT UNIQUE NOT NULL,
  citizen_id UUID REFERENCES public.citizens(id) ON DELETE CASCADE NOT NULL,
  type public.request_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status public.request_status DEFAULT 'pending',
  priority public.request_priority DEFAULT 'medium',
  location TEXT,
  assigned_to UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id UUID REFERENCES public.citizens(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'scheduled',
  assigned_to UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.requests(id) ON DELETE CASCADE,
  sender_phone TEXT NOT NULL,
  content TEXT NOT NULL,
  whatsapp_message_id TEXT,
  is_from_citizen BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citizens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for citizens (authenticated users can view all)
CREATE POLICY "Authenticated users can view citizens" ON public.citizens
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert citizens" ON public.citizens
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update citizens" ON public.citizens
  FOR UPDATE TO authenticated USING (true);

-- Create RLS policies for requests (authenticated users can view all)
CREATE POLICY "Authenticated users can view requests" ON public.requests
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert requests" ON public.requests
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update requests" ON public.requests
  FOR UPDATE TO authenticated USING (true);

-- Create RLS policies for appointments (authenticated users can view all)
CREATE POLICY "Authenticated users can view appointments" ON public.appointments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert appointments" ON public.appointments
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update appointments" ON public.appointments
  FOR UPDATE TO authenticated USING (true);

-- Create RLS policies for messages (authenticated users can view all)
CREATE POLICY "Authenticated users can view messages" ON public.messages
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (true);

-- Create function to generate protocol numbers
CREATE OR REPLACE FUNCTION public.generate_protocol_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  protocol TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM NOW())::TEXT;
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(protocol_number FROM 6) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM public.requests
  WHERE protocol_number LIKE year_part || '%';
  
  protocol := year_part || LPAD(sequence_num::TEXT, 6, '0');
  
  RETURN protocol;
END;
$$ LANGUAGE plpgsql;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_citizens_updated_at
  BEFORE UPDATE ON public.citizens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_requests_updated_at
  BEFORE UPDATE ON public.requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to auto-generate protocol numbers
CREATE OR REPLACE FUNCTION public.set_protocol_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.protocol_number IS NULL OR NEW.protocol_number = '' THEN
    NEW.protocol_number := public.generate_protocol_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_request_protocol_number
  BEFORE INSERT ON public.requests
  FOR EACH ROW EXECUTE FUNCTION public.set_protocol_number();

-- Create trigger to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.raw_user_meta_data ->> 'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
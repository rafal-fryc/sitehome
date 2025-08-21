-- Create articles table to store Substack posts
CREATE TABLE public.articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  substack_url TEXT NOT NULL UNIQUE,
  published_date TIMESTAMP WITH TIME ZONE NOT NULL,
  read_time TEXT,
  category TEXT DEFAULT 'Legal Analysis',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (make articles publicly readable)
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to articles
CREATE POLICY "Articles are publicly readable" 
ON public.articles 
FOR SELECT 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
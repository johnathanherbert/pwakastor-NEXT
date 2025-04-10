-- Storage rooms table
CREATE TABLE public.storage_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Storage spaces table
CREATE TABLE public.storage_spaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  room_id UUID NOT NULL REFERENCES public.storage_rooms(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'empty',
  current_op TEXT,
  recipe_code TEXT,
  material_name TEXT,
  weighing_date DATE,
  last_updated TIMESTAMP WITH TIME ZONE,
  updated_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Storage logs table for tracking allocation and removal history
CREATE TABLE public.storage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id UUID NOT NULL REFERENCES public.storage_spaces(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.storage_rooms(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  op TEXT,
  recipe_code TEXT,
  material_name TEXT,
  weighing_date DATE,
  user_id TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS storage_spaces_room_id_idx ON public.storage_spaces(room_id);
CREATE INDEX IF NOT EXISTS storage_spaces_status_idx ON public.storage_spaces(status);
CREATE INDEX IF NOT EXISTS storage_spaces_current_op_idx ON public.storage_spaces(current_op);
CREATE INDEX IF NOT EXISTS storage_logs_space_id_idx ON public.storage_logs(space_id);
CREATE INDEX IF NOT EXISTS storage_logs_room_id_idx ON public.storage_logs(room_id);

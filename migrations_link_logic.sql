-- Migration: Link Logic (Linked Stacks)

-- Add linked_stacks column to habits to track origin protocols
ALTER TABLE habits
ADD COLUMN IF NOT EXISTS linked_stacks TEXT[] DEFAULT '{}';

-- Ensure it's not null
UPDATE habits SET linked_stacks = '{}' WHERE linked_stacks IS NULL;

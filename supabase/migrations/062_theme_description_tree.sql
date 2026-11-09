-- 062 (2026-11-09) t181/t182: theme descriptions + strict Theme02 tree parent.
-- ADDITIVE ONLY. 060 reserved (expert CRS-38); 061 = engagement-si active ♡ S.I.
--
-- description: 111 words at level 9, 222 at level 6, 333 at level 3 (paid view via GET /themes).
-- tree_parent_id: Theme02 parent (level-6 → level-3, level-9 → level-6 or level-3).
-- parent_theme_id remains the Theme01 category row (unchanged).
ALTER TABLE public.themes
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS tree_parent_id UUID REFERENCES public.themes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS ix_themes_tree_parent ON public.themes(tree_parent_id);

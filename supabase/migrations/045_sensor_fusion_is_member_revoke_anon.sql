-- SensorFusion membership helper: authenticated only (applied live as sensor_fusion_is_member_revoke_anon).
REVOKE ALL ON FUNCTION public.sensor_fusion_is_member(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sensor_fusion_is_member(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.sensor_fusion_is_member(text) TO authenticated;

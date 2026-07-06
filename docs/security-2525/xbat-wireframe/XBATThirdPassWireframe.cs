using System.Collections.Generic;
using UnityEngine;

// X-BAT-inspired conceptual wireframe — 3rd Pass.
// Focus: corrected rear/aft wing shape from upright vertical reference.
// Not an engineering model or replica.
//
// Unity axes:
// X = span, Y = vertical nose-up axis, Z = depth/thickness.

public class XBATThirdPassWireframe : MonoBehaviour
{
    public float Height = 26.0f;
    public int VerticalLines = 23;
    public int SpanLines = 17;
    public float LineWidth = 0.035f;

    private readonly List<Vector3[]> Segments = new List<Vector3[]>();

    private readonly Vector2[] Silhouette = new Vector2[]
    {
        new Vector2( 13.00f,  0.00f),
        new Vector2( 12.15f,  0.95f),
        new Vector2( 10.80f,  2.05f),
        new Vector2(  8.90f,  3.35f),
        new Vector2(  6.90f,  4.75f),
        new Vector2(  4.85f,  6.20f),
        new Vector2(  2.80f,  8.10f),
        new Vector2(  0.55f, 10.90f),
        new Vector2( -1.85f, 13.75f),
        new Vector2( -3.95f, 16.10f),
        new Vector2( -5.45f, 18.30f),
        new Vector2( -6.55f, 19.45f),
        new Vector2( -7.90f, 19.05f),
        new Vector2( -9.20f, 17.45f),
        new Vector2(-10.45f, 14.35f),
        new Vector2(-11.45f, 10.60f),
        new Vector2(-12.45f,  6.10f),
        new Vector2(-13.00f,  2.70f)
    };

    void Start()
    {
        BuildSegments();
        DrawSegments();
    }

    float HalfWidth(float z)
    {
        for (int i = 0; i < Silhouette.Length - 1; i++)
        {
            float z0 = Silhouette[i].x;
            float z1 = Silhouette[i + 1].x;

            if ((z <= z0 && z >= z1) || (z >= z0 && z <= z1))
            {
                float t = Mathf.InverseLerp(z0, z1, z);
                return Mathf.Lerp(Silhouette[i].y, Silhouette[i + 1].y, t);
            }
        }

        return Silhouette[Silhouette.Length - 1].y;
    }

    float DepthProfile(float z, float x)
    {
        float hw = Mathf.Max(HalfWidth(z), 0.0001f);
        float sf = hw > 0.05f ? Mathf.Min(Mathf.Abs(x) / hw, 1.0f) : 0.0f;
        float zn = (z + Height * 0.5f) / Height;

        float verticalBulge = Mathf.Pow(Mathf.Sin(Mathf.PI * zn), 0.68f);
        float bodyCore = Mathf.Exp(-Mathf.Pow(x / Mathf.Max(hw * 0.34f, 0.85f), 2.0f));
        float wingSlab = Mathf.Clamp(1.0f - 0.88f * Mathf.Pow(sf, 1.85f), 0.075f, 1.0f);

        float depth = 0.34f + 2.25f * verticalBulge * wingSlab + 1.62f * bodyCore * verticalBulge;

        if (z < -1.6f)
            depth += 0.35f * Mathf.Exp(-Mathf.Pow(x / 2.65f, 2.0f)) * Mathf.Min((-z - 1.6f) / 11.0f, 1.0f);

        if (z < -4.5f && Mathf.Abs(x) > hw * 0.55f)
            depth *= 0.68f;

        return depth;
    }

    Vector3 SurfacePoint(float z, float x, float side, float offset = 0.0f)
    {
        float depth = side * DepthProfile(z, x) + offset;
        return new Vector3(x, z, depth);
    }

    void AddLine(Vector3 a, Vector3 b)
    {
        Segments.Add(new Vector3[] { a, b });
    }

    void AddPoly(Vector2[] ptsZX, float offset = 0.075f, bool closed = true)
    {
        Vector3[] pts = new Vector3[ptsZX.Length];

        for (int i = 0; i < ptsZX.Length; i++)
            pts[i] = SurfacePoint(ptsZX[i].x, ptsZX[i].y, 1.0f, offset);

        for (int i = 0; i < pts.Length - 1; i++)
            AddLine(pts[i], pts[i + 1]);

        if (closed && pts.Length > 2)
            AddLine(pts[pts.Length - 1], pts[0]);
    }

    void BuildSegments()
    {
        Segments.Clear();

        float[] zs = Linspace(Height * 0.5f, -Height * 0.5f, VerticalLines);
        float[] vs = Linspace(-1.0f, 1.0f, SpanLines);

        foreach (float side in new float[] { 1.0f, -1.0f })
        {
            foreach (float v in vs)
            {
                for (int i = 0; i < zs.Length - 1; i++)
                    AddLine(SurfacePoint(zs[i], HalfWidth(zs[i]) * v, side),
                            SurfacePoint(zs[i + 1], HalfWidth(zs[i + 1]) * v, side));
            }
        }

        foreach (float side in new float[] { 1.0f, -1.0f })
        {
            for (int i = 1; i < zs.Length - 1; i++)
            {
                float hw = HalfWidth(zs[i]);
                float[] xs = Linspace(-hw, hw, SpanLines);

                for (int j = 0; j < xs.Length - 1; j++)
                    AddLine(SurfacePoint(zs[i], xs[j], side),
                            SurfacePoint(zs[i], xs[j + 1], side));
            }
        }

        for (int i = 1; i < zs.Length - 1; i += 2)
        {
            float hw = HalfWidth(zs[i]);
            foreach (float x in Linspace(-hw, hw, 9))
                AddLine(SurfacePoint(zs[i], x, 1.0f), SurfacePoint(zs[i], x, -1.0f));
        }

        // Center spine.
        for (int i = 0; i < zs.Length - 1; i++)
            AddLine(SurfacePoint(zs[i], 0.0f, 1.0f, 0.16f), SurfacePoint(zs[i + 1], 0.0f, 1.0f, 0.16f));

        // Corrected rear wing panels.
        AddPoly(new Vector2[] {
            new Vector2(-6.25f, 11.15f), new Vector2(-7.20f, 17.30f),
            new Vector2(-9.45f, 16.55f), new Vector2(-10.72f, 13.55f),
            new Vector2(-9.42f, 9.45f), new Vector2(-7.05f, 9.95f)
        }, 0.145f, true);

        AddPoly(new Vector2[] {
            new Vector2(-6.25f, -11.15f), new Vector2(-7.20f, -17.30f),
            new Vector2(-9.45f, -16.55f), new Vector2(-10.72f, -13.55f),
            new Vector2(-9.42f, -9.45f), new Vector2(-7.05f, -9.95f)
        }, 0.145f, true);
    }

    void DrawSegments()
    {
        foreach (Vector3[] seg in Segments)
        {
            GameObject lineObj = new GameObject("XBAT_ThirdPass_WireLine");
            lineObj.transform.SetParent(transform, false);

            LineRenderer lr = lineObj.AddComponent<LineRenderer>();
            lr.positionCount = 2;
            lr.SetPositions(seg);
            lr.startWidth = LineWidth;
            lr.endWidth = LineWidth;
            lr.useWorldSpace = false;
            lr.material = new Material(Shader.Find("Sprites/Default"));
        }
    }

    float[] Linspace(float min, float max, int count)
    {
        float[] values = new float[count];
        for (int i = 0; i < count; i++)
            values[i] = Mathf.Lerp(min, max, i / (float)(count - 1));
        return values;
    }
}

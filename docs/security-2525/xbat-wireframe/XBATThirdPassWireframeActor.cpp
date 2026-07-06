#include "XBATThirdPassWireframeActor.h"
#include "Kismet/KismetSystemLibrary.h"

AXBATThirdPassWireframeActor::AXBATThirdPassWireframeActor()
{
    PrimaryActorTick.bCanEverTick = true;
}

void AXBATThirdPassWireframeActor::BeginPlay()
{
    Super::BeginPlay();
}

float AXBATThirdPassWireframeActor::HalfWidth(float Z) const
{
    const TArray<FVector2D> S = {
        FVector2D( 13.00f,  0.00f), FVector2D( 12.15f,  0.95f),
        FVector2D( 10.80f,  2.05f), FVector2D(  8.90f,  3.35f),
        FVector2D(  6.90f,  4.75f), FVector2D(  4.85f,  6.20f),
        FVector2D(  2.80f,  8.10f), FVector2D(  0.55f, 10.90f),
        FVector2D( -1.85f, 13.75f), FVector2D( -3.95f, 16.10f),
        FVector2D( -5.45f, 18.30f), FVector2D( -6.55f, 19.45f),
        FVector2D( -7.90f, 19.05f), FVector2D( -9.20f, 17.45f),
        FVector2D(-10.45f, 14.35f), FVector2D(-11.45f, 10.60f),
        FVector2D(-12.45f,  6.10f), FVector2D(-13.00f,  2.70f)
    };

    for (int32 I = 0; I < S.Num() - 1; I++)
    {
        float Z0 = S[I].X;
        float Z1 = S[I + 1].X;

        if ((Z <= Z0 && Z >= Z1) || (Z >= Z0 && Z <= Z1))
        {
            float T = (Z - Z0) / (Z1 - Z0);
            return FMath::Lerp(S[I].Y, S[I + 1].Y, T);
        }
    }

    return S.Last().Y;
}

float AXBATThirdPassWireframeActor::DepthProfile(float Z, float SpanX) const
{
    float HW = FMath::Max(HalfWidth(Z), 0.0001f);
    float SF = HW > 0.05f ? FMath::Min(FMath::Abs(SpanX) / HW, 1.0f) : 0.0f;
    float ZN = (Z + Height * 0.5f) / Height;

    float VerticalBulge = FMath::Pow(FMath::Sin(PI * ZN), 0.68f);
    float BodyCore = FMath::Exp(-FMath::Pow(SpanX / FMath::Max(HW * 0.34f, 0.85f), 2.0f));
    float WingSlab = FMath::Clamp(1.0f - 0.88f * FMath::Pow(SF, 1.85f), 0.075f, 1.0f);

    float D = 0.34f + 2.25f * VerticalBulge * WingSlab + 1.62f * BodyCore * VerticalBulge;

    if (Z < -1.6f)
        D += 0.35f * FMath::Exp(-FMath::Pow(SpanX / 2.65f, 2.0f)) * FMath::Min((-Z - 1.6f) / 11.0f, 1.0f);

    if (Z < -4.5f && FMath::Abs(SpanX) > HW * 0.55f)
        D *= 0.68f;

    return D;
}

FVector AXBATThirdPassWireframeActor::SurfacePoint(float Z, float SpanX, float Side, float Offset) const
{
    float Depth = Side * DepthProfile(Z, SpanX) + Offset;
    return GetActorLocation() + FVector(Depth, SpanX, Z);
}

void AXBATThirdPassWireframeActor::DrawLineLocal(const FVector& A, const FVector& B) const
{
    UKismetSystemLibrary::DrawDebugLine(this, A, B, FLinearColor::Cyan, 0.0f, 2.0f);
}

void AXBATThirdPassWireframeActor::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);
    DrawFoilWireframe();
}

void AXBATThirdPassWireframeActor::DrawFoilWireframe() const
{
    TArray<float> ZS;
    TArray<float> VS;

    for (int32 I = 0; I < VerticalLines; I++)
        ZS.Add(FMath::Lerp(Height * 0.5f, -Height * 0.5f, I / (float)(VerticalLines - 1)));

    for (int32 I = 0; I < SpanLines; I++)
        VS.Add(FMath::Lerp(-1.0f, 1.0f, I / (float)(SpanLines - 1)));

    for (float Side : { 1.0f, -1.0f })
    {
        for (float V : VS)
        {
            for (int32 I = 0; I < ZS.Num() - 1; I++)
            {
                float X0 = HalfWidth(ZS[I]) * V;
                float X1 = HalfWidth(ZS[I + 1]) * V;
                DrawLineLocal(SurfacePoint(ZS[I], X0, Side), SurfacePoint(ZS[I + 1], X1, Side));
            }
        }
    }

    for (float Side : { 1.0f, -1.0f })
    {
        for (int32 I = 1; I < ZS.Num() - 1; I++)
        {
            float HW = HalfWidth(ZS[I]);

            for (int32 J = 0; J < SpanLines - 1; J++)
            {
                float X0 = FMath::Lerp(-HW, HW, J / (float)(SpanLines - 1));
                float X1 = FMath::Lerp(-HW, HW, (J + 1) / (float)(SpanLines - 1));
                DrawLineLocal(SurfacePoint(ZS[I], X0, Side), SurfacePoint(ZS[I], X1, Side));
            }
        }
    }

    for (int32 I = 1; I < ZS.Num() - 1; I += 2)
    {
        float HW = HalfWidth(ZS[I]);
        for (int32 J = 0; J < 9; J++)
        {
            float X = FMath::Lerp(-HW, HW, J / 8.0f);
            DrawLineLocal(SurfacePoint(ZS[I], X, 1.0f), SurfacePoint(ZS[I], X, -1.0f));
        }
    }
}

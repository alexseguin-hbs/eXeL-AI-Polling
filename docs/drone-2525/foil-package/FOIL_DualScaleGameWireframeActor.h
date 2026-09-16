#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "XBATDualScaleGameWireframeActor.generated.h"

UCLASS()
class YOURPROJECT_API AXBATDualScaleGameWireframeActor : public AActor
{
    GENERATED_BODY()

public:
    AXBATDualScaleGameWireframeActor();
    virtual void Tick(float DeltaTime) override;
    virtual void BeginPlay() override;

    UPROPERTY(EditAnywhere, BlueprintReadWrite) bool UseDemoScale = true;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) bool LowComputeFrameOnly = true;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) float FullWingspan = 11.111f;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) float FullNoseToRear = 7.777f;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) float DemoWingspan = 1.111f;
    UPROPERTY(EditAnywhere, BlueprintReadWrite) float DemoNoseToRear = 0.7777f;

private:
    float XScale, YScale, ZScale, ZTop, ZBottom;
    void ConfigureScale();
    float HalfWidth(float Z) const;
    float DepthProfile(float Z, float SpanX) const;
    FVector SurfacePoint(float Z, float SpanX, float Side = 1.0f, float Offset = 0.0f) const;
    void DrawLineLocal(const FVector& A, const FVector& B) const;
    void DrawGeometry() const;
};

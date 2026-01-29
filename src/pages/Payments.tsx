import { MainLayout } from "../components/layout/MainLayout";

function Payments() {
  return (
    <MainLayout>
      <div className="space-y-8">
        {/* header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Payments</h1>
          <p className="text-muted-foreground mt-1 text-sm lg:text-base">Track and manage all payments</p>
        </div>
      </div>
    </MainLayout>
  )
}

export default Payments;
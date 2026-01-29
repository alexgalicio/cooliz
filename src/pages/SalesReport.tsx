import { MainLayout } from "../components/layout/MainLayout";

function SalesReport() {
  return (
    <MainLayout>
      <div className="space-y-8">
        {/* header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Sales Report</h1>
          <p className="text-muted-foreground mt-1 text-sm lg:text-base">View and export your sales data</p>
        </div>
      </div>
    </MainLayout>
  )
}

export default SalesReport;
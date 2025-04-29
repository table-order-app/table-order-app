import { Button } from "@table-order-system/ui";

function App() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold text-primary mb-6">管理画面</h1>
      <Button label="アクション" />
      <Button label="キャンセル" variant="secondary" />
    </div>
  );
}

export default App;

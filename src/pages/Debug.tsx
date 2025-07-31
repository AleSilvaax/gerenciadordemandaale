import { PermissionDebugger } from '@/components/debug/PermissionDebugger';

export default function DebugPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Debug do Sistema de Permissões</h1>
      <PermissionDebugger />
    </div>
  );
}
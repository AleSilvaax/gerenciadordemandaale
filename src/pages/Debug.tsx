import { PermissionDebugger } from '@/components/debug/PermissionDebugger';
import { RegistrationTest } from '@/components/debug/RegistrationTest';

export default function DebugPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-8">Ferramentas de Debug</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Sistema de Registro</h2>
          <RegistrationTest />
        </div>
        
        <div>
          <h2 className="text-2xl font-semibold mb-4">Sistema de Permissões</h2>
          <PermissionDebugger />
        </div>
      </div>
    </div>
  );
}
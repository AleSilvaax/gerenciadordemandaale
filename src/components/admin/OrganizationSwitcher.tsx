import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface OrganizationSwitcherProps {
  organizations: Organization[];
  selectedOrgId: string;
  onOrgChange: (orgId: string) => void;
  loading?: boolean;
}

export const OrganizationSwitcher: React.FC<OrganizationSwitcherProps> = ({
  organizations,
  selectedOrgId,
  onOrgChange,
  loading = false,
}) => {
  const { user } = useAuth();
  
  // Only show for super admins
  if (user?.role !== 'super_admin') {
    return null;
  }

  if (loading) {
    return (
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-3">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <div className="h-4 bg-muted rounded w-48 animate-pulse" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center gap-3">
        <Building2 className="h-5 w-5 text-muted-foreground" />
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">
            Organização Ativa
          </label>
          <Select value={selectedOrgId} onValueChange={onOrgChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione uma organização" />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
};
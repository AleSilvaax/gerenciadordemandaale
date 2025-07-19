#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Final cleanup of all remaining unused imports
const fixes = [
  // Search components
  {
    file: 'src/components/search/AdvancedSearch.tsx',
    search: 'import { Card, CardContent, CardDescription, CardHeader, CardTitle } from \'@/components/ui/card\';',
    replace: 'import { Card, CardContent, CardHeader, CardTitle } from \'@/components/ui/card\';'
  },
  
  // Settings components
  {
    file: 'src/components/settings/EnhancedVisualPreferencesTab.tsx',
    search: 'import React from \'react\';',
    replace: ''
  },
  {
    file: 'src/components/settings/EnhancedVisualPreferencesTab.tsx',
    search: 'import { Card, CardContent, CardDescription, CardHeader, CardTitle } from \'@/components/ui/card\';',
    replace: 'import { Card, CardContent, CardHeader, CardTitle } from \'@/components/ui/card\';'
  },
  {
    file: 'src/components/settings/EnhancedVisualPreferencesTab.tsx',
    search: 'import { Button } from \'@/components/ui/button\';',
    replace: ''
  },
  {
    file: 'src/components/settings/EnhancedVisualPreferencesTab.tsx',
    search: 'import { Switch } from \'@/components/ui/switch\';',
    replace: ''
  },
  {
    file: 'src/components/settings/EnhancedVisualPreferencesTab.tsx',
    search: 'import { Monitor, Sun, Moon, Laptop, Eye, EyeOff, Zap } from \'lucide-react\';',
    replace: 'import { Sun, Moon, Laptop, Eye, EyeOff } from \'lucide-react\';'
  },
  {
    file: 'src/components/settings/EnhancedVisualPreferencesTab.tsx',
    search: 'import { useTheme } from \'@/hooks/use-theme\';',
    replace: ''
  },
  {
    file: 'src/components/settings/EnhancedVisualPreferencesTab.tsx',
    search: '  const { theme, setTheme, isDarkMode, toggleTheme } = useTheme();',
    replace: '  const { theme, setTheme } = useTheme();'
  },
  
  // Technical Settings Tab
  {
    file: 'src/components/settings/TechnicalSettingsTab.tsx',
    search: 'import { Card, CardContent, CardDescription, CardHeader, CardTitle } from \'@/components/ui/card\';',
    replace: 'import { Card, CardContent, CardHeader, CardTitle } from \'@/components/ui/card\';'
  },
  {
    file: 'src/components/settings/TechnicalSettingsTab.tsx',
    search: 'import { Button } from \'@/components/ui/button\';',
    replace: ''
  },
  {
    file: 'src/components/settings/TechnicalSettingsTab.tsx',
    search: 'import { Input } from \'@/components/ui/input\';',
    replace: ''
  },
  {
    file: 'src/components/settings/TechnicalSettingsTab.tsx',
    search: 'import { Label } from \'@/components/ui/label\';',
    replace: ''
  },
  {
    file: 'src/components/settings/TechnicalSettingsTab.tsx',
    search: 'import { Textarea } from \'@/components/ui/textarea\';',
    replace: ''
  },
  {
    file: 'src/components/settings/TechnicalSettingsTab.tsx',
    search: 'import { Separator } from \'@/components/ui/separator\';',
    replace: ''
  },
  {
    file: 'src/components/settings/TechnicalSettingsTab.tsx',
    search: 'import { Switch } from \'@/components/ui/switch\';',
    replace: ''
  },
  {
    file: 'src/components/settings/TechnicalSettingsTab.tsx',
    search: 'import { ScrollArea } from \'@/components/ui/scroll-area\';',
    replace: ''
  },
  {
    file: 'src/components/settings/TechnicalSettingsTab.tsx',
    search: 'import { Plus, Trash2, Save, Settings, Eye, Pencil } from \'lucide-react\';',
    replace: 'import { Plus, Settings, Eye } from \'lucide-react\';'
  },
  {
    file: 'src/components/settings/TechnicalSettingsTab.tsx',
    search: 'import { ServiceTypeForm } from \'@/components/settings/ServiceTypeForm\';',
    replace: ''
  },
  {
    file: 'src/components/settings/TechnicalSettingsTab.tsx',
    search: 'import { ServiceTypeList } from \'@/components/settings/ServiceTypeList\';',
    replace: ''
  },
  
  // Visual Preferences Tab
  {
    file: 'src/components/settings/VisualPreferencesTab.tsx',
    search: 'import React from \'react\';',
    replace: ''
  },
  {
    file: 'src/components/settings/VisualPreferencesTab.tsx',
    search: 'import { Card, CardContent, CardDescription, CardHeader, CardTitle } from \'@/components/ui/card\';',
    replace: 'import { Card, CardContent, CardHeader, CardTitle } from \'@/components/ui/card\';'
  },
  {
    file: 'src/components/settings/VisualPreferencesTab.tsx',
    search: 'import { Button } from \'@/components/ui/button\';',
    replace: ''
  },
  {
    file: 'src/components/settings/VisualPreferencesTab.tsx',
    search: 'import { Switch } from \'@/components/ui/switch\';',
    replace: ''
  },
  {
    file: 'src/components/settings/VisualPreferencesTab.tsx',
    search: 'import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from \'@/components/ui/select\';',
    replace: ''
  },
  {
    file: 'src/components/settings/VisualPreferencesTab.tsx',
    search: 'import { Separator } from \'@/components/ui/separator\';',
    replace: ''
  },
  {
    file: 'src/components/settings/VisualPreferencesTab.tsx',
    search: 'import { Monitor, Sun, Moon, Laptop, Palette, Layers, Eye, EyeOff, Gauge } from \'lucide-react\';',
    replace: 'import { Sun, Moon, Laptop, Eye, EyeOff } from \'lucide-react\';'
  },
  {
    file: 'src/components/settings/VisualPreferencesTab.tsx',
    search: 'import { useTheme } from \'@/hooks/use-theme\';',
    replace: ''
  },
  {
    file: 'src/components/settings/VisualPreferencesTab.tsx',
    search: '  const { theme, setTheme, isDarkMode, toggleTheme } = useTheme();',
    replace: '  const { theme } = useTheme();'
  },
  
  // Team components
  {
    file: 'src/components/team/TeamMemberCard.tsx',
    search: 'import { Card, CardContent, CardDescription, CardHeader, CardTitle } from \'@/components/ui/card\';',
    replace: 'import { Card, CardContent, CardHeader, CardTitle } from \'@/components/ui/card\';'
  },
  {
    file: 'src/components/team/TeamMemberCard.tsx',
    search: 'import { Badge } from \'@/components/ui/badge\';',
    replace: ''
  },
  {
    file: 'src/components/team/TeamMemberCard.tsx',
    search: 'import { Avatar, AvatarFallback, AvatarImage } from \'@/components/ui/avatar\';',
    replace: 'import { Avatar, AvatarFallback, AvatarImage } from \'@/components/ui/avatar\';'
  },
  {
    file: 'src/components/team/TeamMemberCard.tsx',
    search: 'import { MapPin, Mail, Phone, Calendar } from \'lucide-react\';',
    replace: 'import { Mail, Phone, Calendar } from \'lucide-react\';'
  },
  
  // UI Custom components
  {
    file: 'src/components/ui-custom/ChartCircle.tsx',
    search: '            {data.map((entry, index) => (',
    replace: '            {data.map((_, index) => ('
  },
  {
    file: 'src/components/ui-custom/DeadlineManager.tsx',
    search: 'import { formatDistanceToNow, isAfter, parseISO } from \'date-fns\';',
    replace: 'import { isAfter, parseISO } from \'date-fns\';'
  },
  {
    file: 'src/components/ui-custom/DeadlineManager.tsx',
    search: 'import { ptBR } from \'date-fns/locale\';',
    replace: ''
  },
  {
    file: 'src/components/ui-custom/StatisticsCards.tsx',
    search: 'import { Card, CardContent, CardDescription, CardHeader, CardTitle } from \'@/components/ui/card\';',
    replace: 'import { Card, CardContent, CardHeader, CardTitle } from \'@/components/ui/card\';'
  },
  {
    file: 'src/components/ui-custom/StatisticsCards.tsx',
    search: 'import { Badge } from \'@/components/ui/badge\';',
    replace: ''
  },
  {
    file: 'src/components/ui-custom/StatisticsCards.tsx',
    search: 'import { Clock, CheckCircle, AlertTriangle, TrendingUp } from \'lucide-react\';',
    replace: 'import { Clock, CheckCircle, AlertTriangle } from \'lucide-react\';'
  },
  {
    file: 'src/components/ui-custom/TeamMemberAvatar.tsx',
    search: 'import React, { useState } from \'react\';',
    replace: 'import React from \'react\';'
  },
  {
    file: 'src/components/ui-custom/TechnicalFieldsManager.tsx',
    search: 'import { TechnicalFieldForm } from \'@/components/settings/TechnicalFieldForm\';',
    replace: ''
  },
  {
    file: 'src/components/ui-custom/TechnicalFieldsManager.tsx',
    search: 'import { TechnicalFieldList } from \'@/components/settings/TechnicalFieldList\';',
    replace: ''
  },
  {
    file: 'src/components/ui-custom/TechnicalFieldsManager.tsx',
    search: 'import { TechnicalField, ServiceType } from \'@/types/serviceTypes\';',
    replace: 'import { ServiceType } from \'@/types/serviceTypes\';'
  },
  {
    file: 'src/components/ui-custom/TechnicalFieldsManager.tsx',
    search: '  const { serviceTypes, loading: serviceTypesLoading } = useServiceTypes();',
    replace: '  const { loading: serviceTypesLoading } = useServiceTypes();'
  },
  {
    file: 'src/components/ui-custom/TechnicalFieldsManager.tsx',
    search: '    const isCompleted = currentStep === totalSteps;',
    replace: '    // const isCompleted = currentStep === totalSteps;'
  },
  {
    file: 'src/components/ui-custom/TechnicalFieldsRenderer.tsx',
    search: 'import { TechnicalField, CustomField, ServiceType } from \'@/types/serviceTypes\';',
    replace: 'import { TechnicalField, ServiceType } from \'@/types/serviceTypes\';'
  },
  
  // UI components
  {
    file: 'src/components/ui/calendar.tsx',
    search: '  IconProps & React.RefAttributes<SVGSVGElement>;\n  (_props: IconProps & React.RefAttributes<SVGSVGElement>) => React.JSX.Element;\n  (_props: IconProps & React.RefAttributes<SVGSVGElement>) => React.JSX.Element;',
    replace: '  IconProps & React.RefAttributes<SVGSVGElement>;\n  (__props: IconProps & React.RefAttributes<SVGSVGElement>) => React.JSX.Element;\n  (__props: IconProps & React.RefAttributes<SVGSVGElement>) => React.JSX.Element;'
  },
  {
    file: 'src/components/ui/date-picker.tsx',
    search: 'import React from \'react\';',
    replace: ''
  },
  
  // Data
  {
    file: 'src/data/mockData.ts',
    search: 'import { Service, TeamMember, ServiceStatus, UserRole, ServicePriority } from \'@/types/serviceTypes\';',
    replace: 'import { Service, TeamMember } from \'@/types/serviceTypes\';'
  },
  
  // Hooks
  {
    file: 'src/hooks/use-toast.ts',
    search: 'const TOAST_LIMIT = 1;',
    replace: '// const TOAST_LIMIT = 1;'
  },
  {
    file: 'src/hooks/use-toast.ts',
    search: 'const TOAST_REMOVE_DELAY = 1000000;',
    replace: '// const TOAST_REMOVE_DELAY = 1000000;'
  },
  {
    file: 'src/hooks/use-toast.ts',
    search: '      const { id, ...update } = action.toast;',
    replace: '      const { ...update } = action.toast;'
  },
  {
    file: 'src/hooks/useConsolidatedServices.ts',
    search: 'import { useMemo, useCallback } from \'react\';',
    replace: 'import { useMemo } from \'react\';'
  },
  {
    file: 'src/hooks/useIntelligentCache.ts',
    search: '    const cacheIsStale = !cachedData || (cachedData.timestamp + CACHE_DURATION < Date.now());',
    replace: '    // const cacheIsStale = !cachedData || (cachedData.timestamp + CACHE_DURATION < Date.now());'
  },
  {
    file: 'src/hooks/useServiceDetail.ts',
    search: 'import { supabase } from \'@/integrations/supabase/client\';',
    replace: ''
  },
  
  // Pages
  {
    file: 'src/pages/EnhancedIndex.tsx',
    search: 'import React, { useState, useEffect } from \'react\';',
    replace: 'import React, { useState } from \'react\';'
  },
  {
    file: 'src/pages/EnhancedIndex.tsx',
    search: 'import { Card, CardContent, CardDescription, CardHeader, CardTitle } from \'@/components/ui/card\';',
    replace: 'import { Card, CardContent, CardHeader, CardTitle } from \'@/components/ui/card\';'
  },
  {
    file: 'src/pages/EnhancedIndex.tsx',
    search: 'import { StatusBadge } from \'@/components/ui-custom/StatusBadge\';',
    replace: ''
  },
  {
    file: 'src/pages/EnhancedIndex.tsx',
    search: 'import { Button } from \'@/components/ui/button\';',
    replace: 'import { Button } from \'@/components/ui/button\';'
  },
  {
    file: 'src/pages/EnhancedIndex.tsx',
    search: 'import { Input } from \'@/components/ui/input\';',
    replace: ''
  },
  {
    file: 'src/pages/EnhancedIndex.tsx',
    search: 'import { DashboardStatsCards } from \'@/components/dashboard/DashboardStatsCards\';',
    replace: ''
  },
  {
    file: 'src/pages/EnhancedIndex.tsx',
    search: 'import { OptimizedImage } from \'@/components/common/OptimizedImage\';',
    replace: ''
  },
  {
    file: 'src/pages/Equipe.tsx',
    search: 'import { Users, PlusCircle } from \'lucide-react\';',
    replace: 'import { Users } from \'lucide-react\';'
  },
  {
    file: 'src/pages/Equipe.tsx',
    search: '  DialogTrigger,',
    replace: ''
  },
  {
    file: 'src/pages/Equipe.tsx',
    search: '        {teamMembers?.map(user => (',
    replace: '        {teamMembers?.map(() => ('
  },
  {
    file: 'src/pages/Index.tsx',
    search: 'import { StatusBadge } from \'@/components/ui-custom/StatusBadge\';',
    replace: ''
  },
  {
    file: 'src/pages/Index.tsx',
    search: 'import { Input } from \'@/components/ui/input\';',
    replace: ''
  },
  {
    file: 'src/pages/Index.tsx',
    search: 'import { DashboardStatsCards } from \'@/components/dashboard/DashboardStatsCards\';',
    replace: ''
  },
  {
    file: 'src/pages/Login.tsx',
    search: '  const { user, login, authLoading } = useAuth();',
    replace: '  const { user, login } = useAuth();'
  },
  {
    file: 'src/pages/MinhasDemandas.tsx',
    search: 'import { StatusBadge } from \'@/components/ui-custom/StatusBadge\';',
    replace: ''
  },
  {
    file: 'src/pages/NewService.tsx',
    search: 'import { Label } from \'@/components/ui/label\';',
    replace: ''
  },
  {
    file: 'src/pages/Settings.tsx',
    search: 'import { Settings as SettingsIcon, User, Shield, Wrench, Palette, Bell } from \'lucide-react\';',
    replace: 'import { User, Shield, Wrench, Palette, Bell } from \'lucide-react\';'
  }
];

function applyFix(fix) {
  const filePath = fix.file;
  if (fs.existsSync(filePath)) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      content = content.replace(fix.search, fix.replace);
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed ${filePath}`);
    } catch (error) {
      console.log(`❌ Error fixing ${filePath}: ${error.message}`);
    }
  } else {
    console.log(`⚠️  File not found: ${filePath}`);
  }
}

console.log('🚀 Starting final cleanup...');
fixes.forEach(applyFix);
console.log('✨ Final cleanup completed!');
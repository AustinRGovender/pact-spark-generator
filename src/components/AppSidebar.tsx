import React from 'react';
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from './ui/sidebar';
import { 
  Home, 
  FileText, 
  Code2, 
  Settings, 
  History, 
  Sparkles,
  Languages,
  Download,
  Github
} from 'lucide-react';

const navigationItems = [
  { 
    title: 'Dashboard', 
    icon: Home, 
    href: '#dashboard',
    description: 'Overview & analytics'
  },
  { 
    title: 'Generator', 
    icon: Sparkles, 
    href: '#generator',
    description: 'Create contract tests',
    active: true
  },
  { 
    title: 'Languages', 
    icon: Languages, 
    href: '#languages',
    description: 'Supported frameworks'
  },
  { 
    title: 'History', 
    icon: History, 
    href: '#history',
    description: 'Generated projects'
  },
];

const resourceItems = [
  { 
    title: 'Documentation', 
    icon: FileText, 
    href: '#docs',
    description: 'Learn & guides'
  },
  { 
    title: 'API Reference', 
    icon: Code2, 
    href: '#api',
    description: 'Technical specs'
  },
  { 
    title: 'Examples', 
    icon: Download, 
    href: '#examples',
    description: 'Sample projects'
  },
  { 
    title: 'GitHub', 
    icon: Github, 
    href: 'https://github.com',
    description: 'Source code'
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar className="border-r border-glass-border">
      <SidebarContent className="py-4">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-2">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    className={`
                      w-full rounded-lg transition-all duration-200
                      ${item.active 
                        ? 'bg-primary/10 text-primary border border-primary/20 shadow-colored' 
                        : 'hover:bg-secondary/50 hover:shadow-soft'
                      }
                    `}
                  >
                    <a href={item.href} className="flex items-center space-x-3 p-3">
                      <item.icon className={`h-5 w-5 flex-shrink-0 ${item.active ? 'text-primary' : 'text-muted-foreground'}`} />
                      {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{item.title}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {item.description}
                          </div>
                        </div>
                      )}
                      {item.active && !isCollapsed && (
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      )}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Resources */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Resources
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-2">
              {resourceItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    className="w-full rounded-lg transition-all duration-200 hover:bg-secondary/50 hover:shadow-soft"
                  >
                    <a 
                      href={item.href} 
                      className="flex items-center space-x-3 p-3"
                      target={item.href.startsWith('http') ? '_blank' : undefined}
                      rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                      {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{item.title}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {item.description}
                          </div>
                        </div>
                      )}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer */}
        <div className="mt-auto px-4 py-4">
          <div className={`glass-panel p-3 rounded-lg ${isCollapsed ? 'text-center' : ''}`}>
            {!isCollapsed ? (
              <div>
                <div className="text-sm font-medium">Ready to generate</div>
                <div className="text-xs text-muted-foreground">
                  Upload your OpenAPI spec
                </div>
              </div>
            ) : (
              <Sparkles className="h-5 w-5 text-primary mx-auto" />
            )}
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
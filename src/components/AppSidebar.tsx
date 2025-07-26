import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
    title: 'Generator', 
    icon: Sparkles, 
    href: '/',
    description: 'Create contract tests'
  },
  { 
    title: 'Languages', 
    icon: Languages, 
    href: '/languages',
    description: 'Supported frameworks'
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
  const location = useLocation();
  const isCollapsed = state === 'collapsed';
  
  const isActive = (href: string) => location.pathname === href;

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
                      w-full rounded-lg transition-all duration-200 min-h-[60px]
                      ${item.active 
                        ? 'bg-primary/10 text-primary border border-primary/20 shadow-colored' 
                        : 'hover:bg-secondary/50 hover:shadow-soft'
                      }
                    `}
                  >
                    <a href={item.href} className="flex items-start space-x-3 p-3">
                      <item.icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${item.active ? 'text-primary' : 'text-muted-foreground'}`} />
                      {!isCollapsed && (
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="font-medium text-sm leading-tight">{item.title}</div>
                          <div className="text-xs text-muted-foreground leading-tight line-clamp-2">
                            {item.description}
                          </div>
                        </div>
                      )}
                      {item.active && !isCollapsed && (
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0 mt-1" />
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
                    className="w-full rounded-lg transition-all duration-200 hover:bg-secondary/50 hover:shadow-soft min-h-[60px]"
                  >
                    <a 
                      href={item.href} 
                      className="flex items-start space-x-3 p-3"
                      target={item.href.startsWith('http') ? '_blank' : undefined}
                      rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                      {!isCollapsed && (
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="font-medium text-sm leading-tight">{item.title}</div>
                          <div className="text-xs text-muted-foreground leading-tight line-clamp-2">
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
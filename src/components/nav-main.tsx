import * as React from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from './ui/sidebar'

export interface NavMainItem {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number | string
  isActive?: boolean
}

export interface NavMainProps {
  items: NavMainItem[]
}

export function NavMain({ items }: NavMainProps) {
  const location = useLocation()

  return (
    <SidebarMenu>
      {items.map((item) => {
        const Icon = item.icon
        const isActive =
          item.isActive !== undefined
            ? item.isActive
            : item.url === '/dashboard'
              ? location.pathname.startsWith('/dashboard')
              : item.url === '/feed'
                ? location.pathname.startsWith('/feed')
                : item.url === '/bookmarks'
                  ? location.pathname.startsWith('/bookmarks')
                  : item.url === '/notifications'
                    ? location.pathname.startsWith('/notifications')
                    : location.pathname === item.url

        const showBadge =
          item.badge !== undefined &&
          (typeof item.badge === 'number' ? item.badge > 0 : Boolean(item.badge))

        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild isActive={isActive} size="lg">
              <Link to={item.url} title={item.title} className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="relative shrink-0 flex items-center justify-center">
                    <Icon className={`size-5 shrink-0 text-black ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                    {showBadge && (
                      <span className="hidden group-data-[collapsible=icon]:block absolute -top-1 -right-1 size-2 rounded-full bg-amber-500 ring-2 ring-canvas" />
                    )}
                  </div>
                  <span className="text-[14px] text-black font-bold tracking-tight truncate group-data-[collapsible=icon]:hidden">
                    {item.title}
                  </span>
                </div>

                {showBadge && (
                  <span className="ml-auto px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black bg-amber-500 text-amber-950 shrink-0 group-data-[collapsible=icon]:hidden">
                    {item.badge}
                  </span>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}

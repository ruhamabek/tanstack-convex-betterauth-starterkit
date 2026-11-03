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
                  : location.pathname === item.url

        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild isActive={isActive} size="lg">
              <Link to={item.url} title={item.title}>
                <Icon className={`size-5 shrink-0 text-black ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="text-[14px] text-black font-bold tracking-tight group-data-[collapsible=icon]:hidden">{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}

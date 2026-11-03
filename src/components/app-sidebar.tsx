import * as React from 'react'
import {
  Home,
  Bookmark,
  Flame,
  Sparkles,
  Award,
  User,
  Plus,
  Globe,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import type { Doc } from '../../convex/_generated/dataModel'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from './ui/sidebar'
import { NavMain } from './nav-main'
import { NavUser } from './nav-user'
import Logo from './Logo'

const navData = {
  navMain: [
    {
      title: 'Home Feed',
      url: '/feed',
      icon: Home,
    },
    {
      title: 'Bookmarks',
      url: '/bookmarks',
      icon: Bookmark,
    },
    {
      title: 'Profile',
      url: '/dashboard',
      icon: User,
    },
    {
      title: 'Consensus Layer',
      url: '/#consensus',
      icon: Flame,
    },
    {
      title: 'Thursday Drop',
      url: '/#drops',
      icon: Sparkles,
    },
    {
      title: 'Taste Scorecards',
      url: '/#card-maker',
      icon: Award,
    },
    {
      title: 'Public Showcase',
      url: '/',
      icon: Globe,
    },
  ],
}

export interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: { name?: string; email?: string; image?: string | null } | null
  profile?: Doc<'profiles'> | null
}

export function AppSidebar({ user, profile, ...props }: AppSidebarProps) {
  const triggerOpenEvaluate = () => {
    window.dispatchEvent(new CustomEvent('screenlog:open-evaluate'))
  }

  const triggerOpenSpecimen = () => {
    window.dispatchEvent(new CustomEvent('screenlog:open-specimen'))
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* Brand Logo Header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-1 px-1 py-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <Link to="/" className="flex items-center gap-2 hover:opacity-85 transition group-data-[collapsible=icon]:justify-center" title="Screenlog">
              <Logo size="md" className="p-0" textClassName="group-data-[collapsible=icon]:hidden" />
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Main Navigation & Action CTAs */}
      <SidebarContent>
        <NavMain items={navData.navMain} />

        {/* Action Buttons: Pushed to the bottom directly above profile */}
        <div className="mt-auto pt-4 px-1 space-y-2 select-none group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:space-y-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center">
          {/* Expanded full buttons */}
          <button
            type="button"
            onClick={triggerOpenEvaluate}
            className="w-full rounded-full bg-foreground hover:bg-neutral-800 text-background font-black py-3 px-4 text-xs tracking-tight transition active:scale-95 shadow-xs cursor-pointer flex items-center justify-center gap-2 group-data-[collapsible=icon]:hidden"
            title="Evaluate a living app or feature"
          >
            <Plus className="size-4 stroke-[3]" />
            <span>Evaluate App</span>
          </button>

          <button
            type="button"
            onClick={triggerOpenSpecimen}
            className="w-full rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-900 font-bold py-2.5 px-4 text-xs transition active:scale-95 shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 group-data-[collapsible=icon]:hidden"
            title="Ingest Dribbble, Figma, or Mobbin specimen"
          >
            <Sparkles className="size-3.5 text-amber-700" />
            <span>Ingest Specimen</span>
          </button>

          {/* Collapsed circular icon buttons */}
          <button
            type="button"
            onClick={triggerOpenEvaluate}
            className="hidden group-data-[collapsible=icon]:flex size-10 rounded-full bg-foreground hover:bg-neutral-800 text-background font-black items-center justify-center transition active:scale-95 shadow-xs cursor-pointer shrink-0"
            title="Evaluate App"
          >
            <Plus className="size-4.5 stroke-[3]" />
            <span className="sr-only">Evaluate App</span>
          </button>

          <button
            type="button"
            onClick={triggerOpenSpecimen}
            className="hidden group-data-[collapsible=icon]:flex size-10 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-900 font-bold items-center justify-center transition active:scale-95 shadow-2xs cursor-pointer shrink-0"
            title="Ingest Specimen"
          >
            <Sparkles className="size-4 text-amber-700" />
            <span className="sr-only">Ingest Specimen</span>
          </button>
        </div>
      </SidebarContent>

      {/* Critic Account Pill Footer */}
      <SidebarFooter>
        <NavUser user={user} profile={profile} />
      </SidebarFooter>
    </Sidebar>
  )
}

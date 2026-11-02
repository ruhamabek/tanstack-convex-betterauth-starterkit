import * as React from 'react'
import { PanelLeft } from 'lucide-react'

const SIDEBAR_COOKIE_NAME = 'sidebar_state'
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = '16rem'
const SIDEBAR_WIDTH_MOBILE = '18rem'
const SIDEBAR_WIDTH_ICON = '4.25rem'
const SIDEBAR_KEYBOARD_SHORTCUT = 'b'

type SidebarContext = {
  state: 'expanded' | 'collapsed'
  open: boolean
  setOpen: (open: boolean | ((value: boolean) => boolean)) => void
  openMobile: boolean
  setOpenMobile: (open: boolean | ((value: boolean) => boolean)) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.')
  }
  return context
}

export const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    defaultOpen?: boolean
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className = '',
      style,
      children,
      ...props
    },
    ref,
  ) => {
    const [isMobile, setIsMobile] = React.useState(false)
    const [openMobile, setOpenMobile] = React.useState(false)
    const [_open, _setOpen] = React.useState(defaultOpen)

    const open = openProp !== undefined ? openProp : _open
    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === 'function' ? value(open) : value
        if (setOpenProp) {
          setOpenProp(openState)
        } else {
          _setOpen(openState)
        }
        if (typeof document !== 'undefined') {
          document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
        }
      },
      [setOpenProp, open],
    )

    // Mobile media query check (< 1024px for tablets/phones)
    React.useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 1024)
      }
      checkMobile()
      window.addEventListener('resize', checkMobile)
      return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Helper toggle
    const toggleSidebar = React.useCallback(() => {
      return isMobile ? setOpenMobile((prev) => !prev) : setOpen((prev) => !prev)
    }, [isMobile, setOpen, setOpenMobile])

    // Keyboard shortcut (Ctrl+B or Cmd+B)
    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault()
          toggleSidebar()
        }
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }, [toggleSidebar])

    const state = open ? 'expanded' : 'collapsed'

    const contextValue = React.useMemo<SidebarContext>(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar],
    )

    return (
      <SidebarContext.Provider value={contextValue}>
        <div
          style={
            {
              '--sidebar-width': SIDEBAR_WIDTH,
              '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
              ...style,
            } as React.CSSProperties
          }
          className={`group/sidebar-wrapper flex min-h-svh w-full bg-desk text-foreground ${className}`}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      </SidebarContext.Provider>
    )
  },
)
SidebarProvider.displayName = 'SidebarProvider'

export const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    side?: 'left' | 'right'
    variant?: 'sidebar' | 'floating' | 'inset'
    collapsible?: 'offcanvas' | 'icon' | 'none'
  }
>(
  (
    {
      side = 'left',
      variant = 'sidebar',
      collapsible = 'icon',
      className = '',
      children,
      ...props
    },
    ref,
  ) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

    // Mobile slide-over drawer with backdrop
    if (isMobile) {
      if (!openMobile) return null

      return (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setOpenMobile(false)}
          />

          {/* Drawer Panel */}
          <div
            ref={ref}
            data-mobile="true"
            className={`relative flex h-full w-[${SIDEBAR_WIDTH_MOBILE}] max-w-[85vw] flex-col bg-canvas border-r border-black/10 p-4 shadow-2xl z-50 ${className}`}
            {...props}
          >
            {children}
          </div>
        </div>
      )
    }

    // Desktop responsive sidebar
    return (
      <aside
        ref={ref}
        data-state={state}
        data-collapsible={state === 'collapsed' ? collapsible : ''}
        data-variant={variant}
        data-side={side}
        className={`group peer hidden lg:block text-sidebar-foreground transition-all duration-200 ease-in-out shrink-0 ${
          state === 'collapsed'
            ? collapsible === 'icon'
              ? 'w-(--sidebar-width-icon)'
              : 'w-0 overflow-hidden'
            : 'w-(--sidebar-width)'
        } ${className}`}
        {...props}
      >
        <div
          className={`sticky top-0 h-screen w-full flex flex-col justify-between border-r border-black/10 bg-canvas/80 backdrop-blur-md select-none ${
            variant === 'floating'
              ? 'm-3 rounded-2xl border shadow-sm'
              : variant === 'inset'
                ? 'bg-canvas'
                : 'bg-canvas'
          }`}
        >
          {children}
        </div>
      </aside>
    )
  },
)
Sidebar.displayName = 'Sidebar'

export const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<'button'>
>(({ className = '', onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      ref={ref}
      type="button"
      data-sidebar="trigger"
      aria-label="Toggle Sidebar"
      className={`size-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-neutral-500 hover:text-foreground transition cursor-pointer ${className}`}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <PanelLeft className="size-4" />
      <span className="sr-only">Toggle Sidebar</span>
    </button>
  )
})
SidebarTrigger.displayName = 'SidebarTrigger'

export const SidebarRail = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<'button'>
>(({ className = '', ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      ref={ref}
      data-sidebar="rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={`absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-black/10 group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex cursor-pointer ${className}`}
      {...props}
    />
  )
})
SidebarRail.displayName = 'SidebarRail'

export const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'main'>
>(({ className = '', ...props }, ref) => {
  return (
    <main
      ref={ref}
      className={`relative flex h-screen max-h-screen flex-1 flex-col bg-desk overflow-hidden ${className}`}
      {...props}
    />
  )
})
SidebarInset.displayName = 'SidebarInset'

export const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ className = '', ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="header"
      className={`flex flex-col gap-2 p-3 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:items-center ${className}`}
      {...props}
    />
  )
})
SidebarHeader.displayName = 'SidebarHeader'

export const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ className = '', ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="content"
      className={`flex min-h-0 flex-1 flex-col gap-2 overflow-auto px-3 py-2 scrollbar-none group-data-[collapsible=icon]:px-1.5 group-data-[collapsible=icon]:items-center ${className}`}
      {...props}
    />
  )
})
SidebarContent.displayName = 'SidebarContent'

export const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ className = '', ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="footer"
      className={`flex flex-col gap-2 p-3 border-t border-black/5 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:items-center ${className}`}
      {...props}
    />
  )
})
SidebarFooter.displayName = 'SidebarFooter'

export const SidebarSeparator = React.forwardRef<
  HTMLHRElement,
  React.ComponentProps<'hr'>
>(({ className = '', ...props }, ref) => {
  return (
    <hr
      ref={ref}
      data-sidebar="separator"
      className={`border-b border-black/5 my-2 mx-1 ${className}`}
      {...props}
    />
  )
})
SidebarSeparator.displayName = 'SidebarSeparator'

export const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<'ul'>
>(({ className = '', ...props }, ref) => {
  return (
    <ul
      ref={ref}
      data-sidebar="menu"
      className={`flex w-full min-w-0 flex-col gap-1 list-none p-0 m-0 group-data-[collapsible=icon]:items-center ${className}`}
      {...props}
    />
  )
})
SidebarMenu.displayName = 'SidebarMenu'

export const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<'li'>
>(({ className = '', ...props }, ref) => {
  return (
    <li
      ref={ref}
      data-sidebar="menu-item"
      className={`relative list-none group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full ${className}`}
      {...props}
    />
  )
})
SidebarMenuItem.displayName = 'SidebarMenuItem'

export const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<'button'> & {
    asChild?: boolean
    isActive?: boolean
    size?: 'default' | 'sm' | 'lg'
  }
>(
  (
    {
      asChild = false,
      isActive = false,
      size = 'default',
      className = '',
      children,
      ...props
    },
    ref,
  ) => {
    const sizeClasses =
      size === 'sm'
        ? 'h-8 text-xs px-2.5 gap-2 group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center'
        : size === 'lg'
          ? 'h-11 text-base px-4 gap-3.5 group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center'
          : 'h-10 text-sm px-3.5 gap-3 group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center'

    const activeClasses = isActive
      ? 'bg-black/5 font-black text-foreground'
      : 'text-neutral-600 hover:text-foreground hover:bg-black/5 font-semibold'

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ref,
        className: `flex w-full items-center rounded-xl transition-colors cursor-pointer select-none !no-underline ${sizeClasses} ${activeClasses} ${className} ${
          (children.props as any)?.className || ''
        }`,
        ...props,
      })
    }

    return (
      <button
        ref={ref}
        type="button"
        data-sidebar="menu-button"
        data-active={isActive}
        className={`flex w-full items-center rounded-xl transition-colors cursor-pointer select-none ${sizeClasses} ${activeClasses} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  },
)
SidebarMenuButton.displayName = 'SidebarMenuButton'

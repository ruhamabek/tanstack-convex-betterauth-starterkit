import { Link } from '@tanstack/react-router'

interface LogoProps {
  className?: string
  emblemClassName?: string
  textClassName?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  href?: string
}

const sizeConfig = {
  sm: {
    emblem: 'size-6 rounded-md',
    text: 'text-[15px]',
    gap: 'gap-2',
  },
  md: {
    emblem: 'size-7.5 rounded-lg',
    text: 'text-lg',
    gap: 'gap-2.5',
  },
  lg: {
    emblem: 'size-9 rounded-xl',
    text: 'text-xl',
    gap: 'gap-3',
  },
}

export default function Logo({
  className = '',
  textClassName = '',
  size = 'md',
  showText = true,
  href = '/',
}: LogoProps) {
  const config = sizeConfig[size] || sizeConfig.md

  const content = (
    <div
      className={`inline-flex items-center ${config.gap} group transition-transform hover:scale-102 ${className}`}
    >
      <img
        src="/assets/screenlog_emblem.png"
        alt="Screenlog Emblem"
        className={`${config.emblem} shadow-2xs group-hover:shadow-xs transition select-none pointer-events-none shrink-0`}
      />
      {showText && (
        <span
          className={`font-black tracking-tight text-foreground select-none ${config.text} ${textClassName}`}
        >
          Screenlog
        </span>
      )}
    </div>
  )

  if (href) {
    return (
      <Link to={href} className="!no-underline inline-flex items-center">
        {content}
      </Link>
    )
  }

  return content
}

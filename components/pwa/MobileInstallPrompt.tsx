'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export default function MobileInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallButton, setShowInstallButton] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isInStandaloneMode, setIsInStandaloneMode] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Set client-side flag
    setIsClient(true)

    // Check if dismissed recently (within 7 days)
    const dismissedTime = localStorage.getItem('installPromptDismissed')
    if (dismissedTime && (Date.now() - parseInt(dismissedTime)) < 7 * 24 * 60 * 60 * 1000) {
      setIsDismissed(true)
      return
    }

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Check if already in standalone mode
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    setIsInStandaloneMode(standalone)

    if (standalone) {
      setIsInstalled(true)
      return
    }

    // For non-iOS devices with PWA support
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Show after user interaction
      setTimeout(() => {
        setShowInstallButton(true)
      }, 2000)
    }

    const appInstalledHandler = () => {
      setIsInstalled(true)
      setShowInstallButton(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', appInstalledHandler)

    // For iOS, show manual instructions after some interaction
    if (iOS && !standalone) {
      setTimeout(() => {
        setShowInstallButton(true)
      }, 3000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', appInstalledHandler)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
        setShowInstallButton(false)
      }
    } catch (error) {
      console.error('Error during install prompt:', error)
    }
  }

  const handleDismiss = () => {
    setShowInstallButton(false)
    setIsDismissed(true)
    // Only access localStorage on client side
    if (typeof window !== 'undefined') {
      localStorage.setItem('installPromptDismissed', Date.now().toString())
    }
  }

  // Don't render anything until client-side hydration is complete
  if (!isClient) {
    return null
  }

  // Don't show if dismissed, already installed, or not ready to show
  if (isDismissed || isInstalled || isInStandaloneMode || !showInstallButton) {
    return null
  }

  return (
    <>
      {/* Android/Chrome Install Prompt */}
      {!isIOS && deferredPrompt && (
        <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Install Questify
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Install for offline access and better performance
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                ✕
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleInstallClick}
                className="flex-1 text-sm bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 px-3 py-2"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Manual Install Instructions */}
      {isIOS && !isInStandaloneMode && (
        <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Install Questify
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <span>1. Tap</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    <span>in Safari</span>
                  </div>
                  <div>2. Select "Add to Home Screen"</div>
                  <div>3. Tap "Add" to install</div>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
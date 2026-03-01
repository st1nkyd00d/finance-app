import { createContext, useContext, useState } from 'react'

const PrivacyContext = createContext(null)

export function PrivacyProvider({ children }) {
  const [balancesHidden, setBalancesHidden] = useState(
    () => localStorage.getItem('balancesHidden') === 'true'
  )

  function togglePrivacy() {
    setBalancesHidden((prev) => {
      const next = !prev
      localStorage.setItem('balancesHidden', String(next))
      return next
    })
  }

  return (
    <PrivacyContext.Provider value={{ balancesHidden, togglePrivacy }}>
      {children}
    </PrivacyContext.Provider>
  )
}

export function usePrivacy() {
  return useContext(PrivacyContext)
}

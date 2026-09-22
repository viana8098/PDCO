import { HashRouter, NavLink, Route, Routes } from 'react-router-dom'
import { PdcoProvider } from './lib/PdcoContext'
import AcaoDetail from './pages/AcaoDetail'
import AreaDetail from './pages/AreaDetail'
import Diretoria from './pages/Diretoria'
import Estrategicos from './pages/Estrategicos'
import Evolucao from './pages/Evolucao'
import MinhaArea from './pages/MinhaArea'
import PlanoDetail from './pages/PlanoDetail'
import './pdco.css'

const ICONE_NAV = {
    area: (
        <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M3 6a1 1 0 0 1 1-1h4l1.5 2H16a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6Z" strokeLinejoin="round" />
        </svg>
    ),
    diretoria: (
        <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="3" y="3" width="6" height="6" rx="1" />
            <rect x="11" y="3" width="6" height="6" rx="1" />
            <rect x="3" y="11" width="6" height="6" rx="1" />
            <rect x="11" y="11" width="6" height="6" rx="1" />
        </svg>
    ),
    estrategicos: (
        <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="10" cy="10" r="7" />
            <circle cx="10" cy="10" r="3.5" />
            <circle cx="10" cy="10" r="0.6" fill="currentColor" />
        </svg>
    ),
    evolucao: (
        <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="3" y="4" width="14" height="13" rx="1.5" />
            <path d="M3 8h14M7 2.5v3M13 2.5v3" strokeLinecap="round" />
        </svg>
    ),
}

const NAV = [
    { to: '/', label: 'Minha Área', icone: 'area', fim: true },
    { to: '/diretoria', label: 'Diretoria', icone: 'diretoria' },
    { to: '/estrategicos', label: 'Estratégicos', icone: 'estrategicos' },
    { to: '/evolucao', label: 'Evolução', icone: 'evolucao' },
]

/**
 * Painel de Cultura e Movimento — versão standalone (sem iDigital, sem
 * escopo por gestor: sempre a visão consolidada). Deploy estático no
 * Cloudflare Pages, dados vindos de um snapshot gerado localmente contra o
 * dw real (ver scripts/gerar-snapshot.mjs) — mesmo padrão do PPR/PRESIDENTE.
 */
export default function App() {
    return (
        <HashRouter>
            <PdcoProvider>
                <div className="pdco-app">
                    <div className="pdco-content">
                        <header className="pdco-standalone-header">
                            <span className="pdco-standalone-brand">Painel de Cultura e Movimento</span>
                        </header>

                        <nav className="pdco-subnav">
                            {NAV.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.fim}
                                    className={({ isActive }) => `pdco-subnav-link ${isActive ? 'pdco-subnav-ativo' : ''}`}
                                >
                                    {ICONE_NAV[item.icone]}
                                    {item.label}
                                </NavLink>
                            ))}
                        </nav>

                        <Routes>
                            <Route index element={<MinhaArea />} />
                            <Route path="diretoria" element={<Diretoria />} />
                            <Route path="estrategicos" element={<Estrategicos />} />
                            <Route path="area/:areaChave" element={<AreaDetail />} />
                            <Route path="evolucao" element={<Evolucao />} />
                            <Route path="plano/:cdPlanoAcao" element={<PlanoDetail />} />
                            <Route path="plano/:cdPlanoAcao/acao/:cdAcao" element={<AcaoDetail />} />
                        </Routes>
                    </div>
                </div>
            </PdcoProvider>
        </HashRouter>
    )
}

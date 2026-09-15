import { HashRouter, NavLink, Route, Routes } from 'react-router-dom'
import { PdcoProvider } from './lib/PdcoContext'
import AcaoDetail from './pages/AcaoDetail'
import AreaDetail from './pages/AreaDetail'
import Diretoria from './pages/Diretoria'
import Evolucao from './pages/Evolucao'
import MinhaArea from './pages/MinhaArea'
import PlanoDetail from './pages/PlanoDetail'
import './pdco.css'

/**
 * Painel de Cultura Organizacional — versão standalone (sem iDigital, sem
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
                            <span className="pdco-standalone-brand">Painel de Cultura Organizacional</span>
                        </header>

                        <nav className="pdco-subnav">
                            <NavLink to="/" end className={({ isActive }) => `pdco-subnav-link ${isActive ? 'pdco-subnav-ativo' : ''}`}>
                                Planos
                            </NavLink>
                            <NavLink to="/diretoria" className={({ isActive }) => `pdco-subnav-link ${isActive ? 'pdco-subnav-ativo' : ''}`}>
                                Diretoria
                            </NavLink>
                            <NavLink to="/evolucao" className={({ isActive }) => `pdco-subnav-link ${isActive ? 'pdco-subnav-ativo' : ''}`}>
                                Evolução
                            </NavLink>
                        </nav>

                        <Routes>
                            <Route index element={<MinhaArea />} />
                            <Route path="diretoria" element={<Diretoria />} />
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

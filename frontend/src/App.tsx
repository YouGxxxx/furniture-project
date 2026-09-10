import { HashRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Cases from './pages/Cases'
import News from './pages/News'
import NewsDetail from './pages/NewsDetail'
import Recruit from './pages/Recruit'
import About from './pages/About'
import History from './pages/History'
import Brand from './pages/Brand'
import Contact from './pages/Contact'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cases" element={<Cases />} />
          <Route path="/news/:cat" element={<News />} />
          <Route path="/news/detail/:id" element={<NewsDetail />} />
          <Route path="/recruit/:type" element={<Recruit />} />
          <Route path="/about" element={<About />} />
          <Route path="/history" element={<History />} />
          <Route path="/brand" element={<Brand />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

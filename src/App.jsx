import { useState } from 'react'
import { addBlock, checkBlocks } from './blockchain'
import { books, universities } from './data'
import './App.css'

const dateFormat = new Intl.DateTimeFormat('ar-SA-u-ca-gregory', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

function BookIcon({ size = 23 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 6.5c-2.7-2.1-6-2.3-9-1.2v13c3-1.1 6.3-.9 9 1.2 2.7-2.1 6-2.3 9-1.2v-13c-3-1.1-6.3-.9-9 1.2Z" />
      <path d="M12 6.5v13" />
    </svg>
  )
}

function SmallIcon({ name }) {
  if (name === 'check') return <span aria-hidden="true">✓</span>
  if (name === 'warning') return <span aria-hidden="true">!</span>
  return <span aria-hidden="true">•</span>
}

function shortHash(hash) {
  if (hash === '0') return '0'
  return `${hash.slice(0, 14)}...`
}

function App() {
  const [university, setUniversity] = useState(universities[0])
  const [chain, setChain] = useState([])
  const [status, setStatus] = useState('empty')
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')

  async function borrowBook(book) {
    if (loading || book.university === university || status === 'invalid') return

    setLoading(true)

    try {
      const today = new Date()
      const dueDate = new Date(today)
      dueDate.setDate(dueDate.getDate() + 14)

      const data = {
        book: book.title,
        from: book.university,
        to: university,
        start: today.toISOString().slice(0, 10),
        end: dueDate.toISOString().slice(0, 10),
      }

      const block = await addBlock(chain, data)
      const updated = [...chain, block]
      setChain(updated)
      setStatus((await checkBlocks(updated)) ? 'valid' : 'invalid')
      setNotice(`تم تسجيل طلب إعارة «${book.title}» من ${book.university}.`)
    } catch {
      setNotice('تعذّر تسجيل الطلب. افتح الموقع من خلال الخادم المحلي وحاول مرة أخرى.')
    } finally {
      setLoading(false)
    }
  }

  async function verifyChain() {
    if (loading || chain.length === 0) return
    setLoading(true)
    try {
      const valid = await checkBlocks(chain)
      setStatus(valid ? 'valid' : 'invalid')
      setNotice(valid ? 'تم فحص جميع الكتل، والسجل سليم.' : 'تم اكتشاف تغيير في إحدى الكتل.')
    } finally {
      setLoading(false)
    }
  }

  async function tamperWithBlock() {
    if (loading || chain.length === 0 || status === 'invalid') return
    setLoading(true)
    try {
      const updated = chain.map((block, index) =>
        index === 0
          ? { ...block, data: { ...block.data, book: 'كتاب تم تعديله' } }
          : block,
      )
      setChain(updated)
      const valid = await checkBlocks(updated)
      setStatus(valid ? 'valid' : 'invalid')
      setNotice(valid ? 'السجل سليم.' : 'تم اكتشاف التلاعب: بيانات الكتلة الأولى لم تعد تطابق الهاش.')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setChain([])
    setStatus('empty')
    setNotice('تم مسح السجل التجريبي.')
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><BookIcon size={24} /></div>
          <div>
            <strong>وَصْل</strong>
            <span>إعارة الكتب الجامعية</span>
          </div>
        </div>
        <span className="demo-label">مشروع مسار التقنيات النشئة</span>
      </header>

      <main className="page">
        <section className="intro">
          <div>
            <span className="eyebrow">المكتبة الرقمية المشتركة</span>
            <h1>الكتب بين الجامعات، في مكان واحد.</h1>
            <p>اختر جامعتك واطلب كتابًا من مكتبة أخرى. يُسجَّل الطلب في كتل مترابطة حتى يمكن التحقق من السجل واكتشاف أي تعديل عليه.</p>
          </div>
          <div className="university-field">
            <label htmlFor="university">الجامعة المستفيدة</label>
            <select id="university" value={university} onChange={(event) => setUniversity(event.target.value)}>
              {universities.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
        </section>

        <div className="main-layout">
          <section className="books-section card-panel">
            <div className="section-heading">
              <div>
                <h2>الكتب المتاحة</h2>
                <p>اختر كتابًا من مكتبة جامعة أخرى</p>
              </div>
              <span className="count-chip">{books.length} كتب</span>
            </div>

            <div className="book-grid">
              {books.map((book) => {
                const isOwnBook = book.university === university
                return (
                  <article className="book-card" key={book.id}>
                    <div className={`book-cover ${book.color}`}><BookIcon size={31} /></div>
                    <div className="book-info">
                      <span className="book-category">{book.category}</span>
                      <h3>{book.title}</h3>
                      <p>{book.university}</p>
                    </div>
                    <button
                      type="button"
                      className={isOwnBook ? 'borrow-btn disabled' : 'borrow-btn'}
                      onClick={() => borrowBook(book)}
                      disabled={isOwnBook || loading || status === 'invalid'}
                    >
                      {isOwnBook ? 'كتاب جامعتك' : 'طلب إعارة'}
                    </button>
                  </article>
                )
              })}
            </div>
          </section>

          <aside className="sidebar">
            <section className="card-panel record-card">
              <div className="section-heading sidebar-heading">
                <div>
                  <h2>سجل البلوك تشين</h2>
                  <p>متابعة سلامة عمليات الإعارة</p>
                </div>
              </div>
              <div className="stat-grid">
                <div className="stat">
                  <span>الطلبات المسجلة</span>
                  <strong>{chain.length}</strong>
                </div>
                <div className="stat">
                  <span>عدد الكتل</span>
                  <strong>{chain.length}</strong>
                </div>
              </div>
              <div className={`chain-state ${status}`}>
                <div className="status-icon"><SmallIcon name={status === 'valid' ? 'check' : status === 'invalid' ? 'warning' : 'empty'} /></div>
                <div>
                  <strong>{status === 'valid' ? 'السلسلة سليمة' : status === 'invalid' ? 'تم اكتشاف تلاعب' : 'لا توجد عمليات بعد'}</strong>
                  <span>{status === 'valid' ? 'البصمات والروابط متطابقة' : status === 'invalid' ? 'تغيّرت بيانات كتلة بدون تحديث بصمتها' : 'سجّل أول إعارة لبدء السلسلة'}</span>
                </div>
              </div>
              <div className="action-buttons">
                <button type="button" className="primary-btn" disabled={!chain.length || loading} onClick={verifyChain}>فحص السلسلة</button>
                <button type="button" className="secondary-btn" disabled={!chain.length || loading || status === 'invalid'} onClick={tamperWithBlock}>تجربة التلاعب</button>
              </div>
              <button type="button" className="reset-btn" disabled={!chain.length || loading} onClick={reset}>إعادة ضبط السجل</button>
            </section>

            <section className="info-card">
              <strong>كيف تعمل الفكرة؟</strong>
              <p>كل طلب إعارة يُحفظ داخل كتلة تحمل بصمتها الرقمية وبصمة الكتلة السابقة. عند تغيير البيانات ينكشف عدم تطابق البصمات.</p>
            </section>
          </aside>
        </div>

        <section className="card-panel history-section">
          <div className="section-heading">
            <div>
              <h2>سجل طلبات الإعارة</h2>
              <p>جميع العمليات المسجلة داخل السلسلة</p>
            </div>
            <span className="count-chip">{chain.length} عمليات</span>
          </div>
          {notice && <p className={`notice ${status === 'invalid' ? 'notice-danger' : ''}`} role="status">{notice}</p>}
          {chain.length === 0 ? (
            <div className="empty-state">
              <BookIcon size={33} />
              <strong>لا توجد طلبات حتى الآن</strong>
              <p>اضغط «طلب إعارة» في أحد الكتب لإضافة أول كتلة.</p>
            </div>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr><th>الكتاب</th><th>من</th><th>إلى</th><th>تاريخ الطلب</th><th>الهاش السابق</th><th>هاش الكتلة</th></tr>
                </thead>
                <tbody>
                  {chain.map((block) => (
                    <tr key={block.index}>
                      <td className="table-title">{block.data.book}</td>
                      <td>{block.data.from}</td>
                      <td>{block.data.to}</td>
                      <td>{dateFormat.format(new Date(block.data.start))}</td>
                      <td title={block.previousHash} className="hash-cell" dir="ltr">{shortHash(block.previousHash)}</td>
                      <td title={block.hash} className="hash-cell" dir="ltr">{shortHash(block.hash)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <p className="footnote"> نموذج اولي.</p>
      </main>
    </div>
  )
}

export default App

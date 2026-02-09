
import { useState } from 'react'
import './RescueRequestCreatePage.css'

const REQUEST_TYPES = [
  { id: 'rescue', label: 'Cứu hộ', description: 'Giải cứu con người khỏi khu vực nguy hiểm' },
  { id: 'relief', label: 'Cứu trợ', description: 'Nhu yếu phẩm, thuốc men sau khi đã an toàn' },
]

const URGENCY_LEVELS = [
  {
    id: 'high',
    label: 'Cao (High)',
    description: 'Đang gặp nguy hiểm trực tiếp đến tính mạng',
    tone: 'border-red-500 bg-red-50 text-red-700',
  },
  {
    id: 'medium',
    label: 'Trung bình (Medium)',
    description: 'Khu vực nguy hiểm nhưng tạm thời ổn định',
    tone: 'border-amber-400 bg-amber-50 text-amber-700',
  },
  {
    id: 'low',
    label: 'Thấp (Low)',
    description: 'Yêu cầu hỗ trợ thông tin hoặc nhu yếu phẩm',
    tone: 'border-sky-400 bg-sky-50 text-sky-700',
  },
]

function StepHeader({ currentStep, totalSteps, title, subtitle }) {
  return (
    <header className="step-header">
      <div className="step-header__row">
        <div className="step-header__breadcrumb">
          <span className="step-header__breadcrumb-main">Tạo yêu cầu</span>
          <span>/</span>
          <span>{title}</span>
        </div>
        <div>
          Bước <span className="font-semibold text-slate-900">{currentStep}</span>/
          {totalSteps}
        </div>
      </div>
      <div>
        <h1 className="step-header__title">{title}</h1>
        {subtitle && <p className="step-header__subtitle">{subtitle}</p>}
      </div>
    </header>
  )
}

function CardSection({ title, description, children }) {
  return (
    <section className="card-section">
      <div className="card-section__header">
        <h2 className="card-section__title">{title}</h2>
        {description && <p className="card-section__description">{description}</p>}
      </div>
      {children}
    </section>
  )
}

function PrimaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      className={`primary-button ${props.className || ''}`}
    >
      {children}
    </button>
  )
}

function GhostButton({ children, ...props }) {
  return (
    <button
      {...props}
      className={`ghost-button ${props.className || ''}`}
    >
      {children}
    </button>
  )
}

export default function RescueRequestCreatePage() {
  const TOTAL_STEPS = 3
  const [step, setStep] = useState(1)

  const [description, setDescription] = useState('')
  const [peopleCount, setPeopleCount] = useState('')
  const [requestType, setRequestType] = useState('rescue')
  const [urgency, setUrgency] = useState('medium')
  const [photos, setPhotos] = useState([])
  const [phone, setPhone] = useState('')

  const handleNext = () => {
    if (step < TOTAL_STEPS) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handlePhotosChange = (event) => {
    const files = Array.from(event.target.files || [])
    setPhotos(files)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    // TODO: Thay bằng gọi API thực tế
    console.log({
      description,
      peopleCount,
      requestType,
      urgency,
      photos,
      phone,
    })
    alert('Yêu cầu cứu hộ đã được tạo (demo).')
  }

  const renderStep = () => {
    if (step === 1) {
      return (
        <>
          <StepHeader
            currentStep={1}
            totalSteps={TOTAL_STEPS}
            title="Mô tả Tình huống"
            subtitle="Vui lòng cung cấp thông tin chi tiết để chúng tôi hỗ trợ bạn nhanh nhất."
          />

          <CardSection
            title="Chi tiết tình huống"
            description="Hãy mô tả rõ ràng vị trí, mức nước, đối tượng cần hỗ trợ..."
          >
            <div className="field-group">
              <div className="field-group">
                <label className="field-label">Mô tả cụ thể sự việc *</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="textarea"
                  placeholder="Ví dụ: Nước dâng cao đến tầng 2, có người già và trẻ em đang bị kẹt..."
                />
              </div>

              <div className="field-group" style={{ maxWidth: '260px' }}>
                <label className="field-label">Số người bị ảnh hưởng *</label>
                <input
                  type="number"
                  min="1"
                  value={peopleCount}
                  onChange={(e) => setPeopleCount(e.target.value)}
                  className="input"
                  placeholder="Số lượng người"
                />
              </div>
            </div>
          </CardSection>
        </>
      )
    }

    if (step === 2) {
      return (
        <>
          <StepHeader
            currentStep={2}
            totalSteps={TOTAL_STEPS}
            title="Loại yêu cầu & Mức độ khẩn cấp"
            subtitle="Chọn loại hỗ trợ và mức độ ưu tiên phù hợp với tình huống."
          />

          <CardSection title="Loại yêu cầu">
            <div className="request-type-grid">
              {REQUEST_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setRequestType(type.id)}
                  className={`request-type-card ${
                    requestType === type.id ? 'request-type-card--selected' : ''
                  }`}
                >
                  <span className="request-type-card__title">{type.label}</span>
                  <span className="request-type-card__description">{type.description}</span>
                </button>
              ))}
            </div>
          </CardSection>

          <CardSection title="Mức độ khẩn cấp">
            <div className="urgency-list">
              {URGENCY_LEVELS.map((level) => (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => setUrgency(level.id)}
                  className={`urgency-item ${
                    urgency === level.id ? `urgency-item--selected urgency-item--${level.id}` : ''
                  }`}
                >
                  <div className="urgency-item__dot" />
                  <div>
                    <div className="urgency-item__label">{level.label}</div>
                    <div className="urgency-item__description">{level.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </CardSection>
        </>
      )
    }

    return (
      <>
        <StepHeader
          currentStep={3}
          totalSteps={TOTAL_STEPS}
          title="Hoàn tất yêu cầu cứu trợ"
          subtitle="Cung cấp hình ảnh hiện trường và thông tin liên lạc để nhận hỗ trợ nhanh nhất."
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]">
          <CardSection title="Ảnh minh họa" description="Tải lên hình ảnh hiện trường hoặc vị trí của bạn (tối đa 5 ảnh).">
            <div className="photo-upload">
              <label
                htmlFor="photo-upload"
                className="photo-upload__dropzone"
              >
                <div className="photo-upload__title">Nhấn để tải ảnh hoặc kéo thả</div>
                <div className="photo-upload__subtitle">PNG, JPG tối đa 10MB, tối đa 5 ảnh</div>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotosChange}
                  className="hidden"
                />
              </label>

              {photos.length > 0 && (
                <div className="photo-upload__grid">
                  {photos.slice(0, 5).map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="photo-upload__item"
                    >
                      <div className="photo-upload__item-label">
                        {file.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardSection>

          <div className="space-y-6">
            <CardSection title="Thông tin liên hệ">
              <div className="contact-info">
                <div className="field-group">
                  <label className="field-label">Số điện thoại di động *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input"
                    placeholder="09xx xxx xxx"
                  />
                </div>
                <p className="contact-info__note">
                  Vui lòng đảm bảo số điện thoại chính xác. Đội cứu hộ sẽ sử dụng số này để xác định vị trí và
                  liên lạc trực tiếp khi tới hiện trường.
                </p>
              </div>
            </CardSection>

            <div className="privacy-note">
              Thông tin của bạn chỉ được chia sẻ với các đơn vị cứu hộ chính thức và tình nguyện viên đã xác
              minh.
            </div>
          </div>
        </div>

        <div className="confirm-footer">
          <div className="confirm-footer__alert">
            <span className="confirm-footer__alert-dot" />
            <span>Vui lòng kiểm tra lại thông tin. Hành động này không thể hoàn tác.</span>
          </div>
          <div className="confirm-footer__actions">
            <GhostButton type="button" onClick={handleBack}>
              Quay lại
            </GhostButton>
            <PrimaryButton type="submit">Gửi yêu cầu</PrimaryButton>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="rescue-shell">
      <header className="rescue-header">
        <div className="rescue-header__bar">
          <div className="rescue-header__brand">
            <div className="rescue-header__logo" />
            <span>RescueSystem</span>
          </div>
          <nav className="rescue-header__nav" aria-label="Main navigation">
            <a href="#" className="rescue-header__link rescue-header__link--active">
              Trang chủ
            </a>
            <a href="#" className="rescue-header__link">
              Tin tức
            </a>
            <a href="#" className="rescue-header__link">
              Hướng dẫn
            </a>
          </nav>
          <div className="rescue-header__actions">
            <button type="button" className="rescue-header__icon-btn" aria-label="Thông báo">
              🔔
            </button>
            <button type="button" className="rescue-header__icon-btn" aria-label="Ứng dụng">
              ◻
            </button>
            <div className="rescue-header__avatar" aria-hidden="true" />
          </div>
        </div>
      </header>

      <div className="rescue-shell__inner">
        <main className="rescue-page">
          <div className="rescue-page__inner">
            <form onSubmit={handleSubmit} className="rescue-form">
              {renderStep()}

              {step < TOTAL_STEPS && (
                <div className="step-nav">
                  <GhostButton type="button" onClick={handleBack} disabled={step === 1}>
                    Quay lại
                  </GhostButton>
                  <PrimaryButton type="button" onClick={handleNext}>
                    Tiếp tục →
                  </PrimaryButton>
                </div>
              )}
            </form>

            <div className="emergency-help">
              <span>Cần hỗ trợ khẩn cấp qua điện thoại?</span>
              <button type="button" className="emergency-help__button">
                <span role="img" aria-hidden="true">
                  ☎
                </span>
                Gọi ngay 115
              </button>
            </div>
          </div>
        </main>
      </div>

      <footer className="rescue-footer">
        <div className="rescue-footer__inner">
          <span>© 2024 RescueSystem - Hệ thống Cứu hộ Khẩn cấp Quốc gia.</span>
          <div className="rescue-footer__links">
            <a href="#" className="rescue-footer__link">
              Chính sách bảo mật
            </a>
            <a href="#" className="rescue-footer__link">
              Điều khoản sử dụng
            </a>
            <a href="#" className="rescue-footer__link">
              Liên hệ
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}


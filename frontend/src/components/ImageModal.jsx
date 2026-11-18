export default function ImageModal({ url, name, onClose }) {
  return (
    <div className="overlay">
      <div style={{ color: '#fff', marginBottom: 10 }}>
        ছবিতে চেপে ধরে সেভ/শেয়ার করুন, অথবা নিচের বোতামে ডাউনলোড করুন
      </div>
      <img src={url} alt={name} />
      <div style={{ marginTop: 12 }}>
        <a href={url} download={name}>⬇ ডাউনলোড</a>
        <button onClick={onClose}>বন্ধ করুন</button>
      </div>
    </div>
  );
}

export default function Map() {
  return (
    <div className="w-full h-full">
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.540089412422!2d106.7894077!3d-6.1922350999999995!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f7a9a67506cd%3A0xc1c3905fcbba6d0c!2sRano%20Cake!5e0!3m2!1sid!2sid!4v1732416949761!5m2!1sid!2sid"
        width="100%"
        height="450"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="rounded-lg"
        title="Lokasi Rano Cake"
      />
    </div>
  );
} 
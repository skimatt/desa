document.addEventListener("DOMContentLoaded", function () {
  // --- Mobile Menu Logic ---
  const mobileMenuButton = document.getElementById("mobile-menu-button");
  const mobileMenu = document.getElementById("mobile-menu");
  const hamburgerIcon = document.getElementById("hamburger-icon");
  const closeIcon = document.getElementById("close-icon");
  // Memilih link di dalam menu mobile. Pastikan link Anda memiliki kelas 'mobile-nav-link' jika menggunakan selector itu,
  // atau sesuaikan selectornya. Di sini saya akan memilih semua <a> di dalam #mobile-menu.
  const navLinks = document.querySelectorAll("#mobile-menu a");

  if (mobileMenuButton && mobileMenu && hamburgerIcon && closeIcon) {
    mobileMenuButton.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden");
      const isMenuHidden = mobileMenu.classList.contains("hidden");

      if (isMenuHidden) {
        // Menu ditutup
        hamburgerIcon.classList.remove("hidden");
        closeIcon.classList.add("hidden");
        mobileMenuButton.setAttribute("aria-expanded", "false");
      } else {
        // Menu dibuka
        hamburgerIcon.classList.add("hidden");
        closeIcon.classList.remove("hidden");
        mobileMenuButton.setAttribute("aria-expanded", "true");
      }
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        mobileMenu.classList.add("hidden"); // Sembunyikan menu
        hamburgerIcon.classList.remove("hidden"); // Tampilkan ikon hamburger
        closeIcon.classList.add("hidden"); // Sembunyikan ikon close
        mobileMenuButton.setAttribute("aria-expanded", "false");
      });
    });
  } else {
    console.error(
      "Satu atau lebih elemen menu mobile tidak ditemukan. Pastikan ID elemen sudah benar."
    );
  }

  // --- Set Current Year in Footer ---
  const yearSpan = document.getElementById("currentYear");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // --- Smooth Scrolling for Anchor Links ---
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const hrefAttribute = this.getAttribute("href");
      // Pastikan hrefAttribute tidak hanya "#" dan bukan null/kosong
      if (
        hrefAttribute &&
        hrefAttribute.length > 1 &&
        hrefAttribute.startsWith("#")
      ) {
        try {
          const targetElement = document.querySelector(hrefAttribute);
          if (targetElement) {
            e.preventDefault();
            // Perhitungkan tinggi header jika sticky
            const headerOffset =
              document.querySelector("header")?.offsetHeight || 0;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition =
              elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth",
            });
          }
        } catch (error) {
          console.warn(
            `Smooth scroll target tidak ditemukan atau selector tidak valid: ${hrefAttribute}`,
            error
          );
        }
      } else if (hrefAttribute === "#") {
        e.preventDefault(); // Mencegah lompatan ke atas halaman untuk link "#" saja
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  });

  // --- Accordion for Public Services ---
  const accordionHeaders = document.querySelectorAll(".accordion-header");
  accordionHeaders.forEach((header) => {
    header.addEventListener("click", function () {
      const content = this.nextElementSibling; // .accordion-content
      const wasActive = this.classList.contains("active");

      // Tutup semua akordeon lain
      document
        .querySelectorAll(".accordion-header.active")
        .forEach((activeHeader) => {
          if (activeHeader !== this) {
            activeHeader.classList.remove("active");
            const otherContent = activeHeader.nextElementSibling;
            if (
              otherContent &&
              otherContent.classList.contains("accordion-content")
            ) {
              otherContent.style.maxHeight = null;
              otherContent.classList.remove("open");
            }
          }
        });

      // Toggle akordeon yang diklik
      if (wasActive) {
        this.classList.remove("active");
        if (content && content.classList.contains("accordion-content")) {
          content.style.maxHeight = null;
          content.classList.remove("open");
        }
      } else {
        this.classList.add("active");
        if (content && content.classList.contains("accordion-content")) {
          content.style.maxHeight = content.scrollHeight + "px";
          content.classList.add("open");
        }
      }
    });
  });

  // --- Gemini API Integration (via Proxy) ---
  const geminiApiUrl = "https://gemini.rahmatyoung10.workers.dev/";

  async function callGeminiAPI(
    prompt,
    outputElementId,
    loadingElementId,
    buttonElement
  ) {
    const outputElement = document.getElementById(outputElementId);
    const loadingElement = document.getElementById(loadingElementId);

    if (!outputElement) {
      console.error(`Output element with ID '${outputElementId}' not found.`);
      return;
    }
    if (!loadingElement) {
      console.error(`Loading element with ID '${loadingElementId}' not found.`);
    }

    if (loadingElement) loadingElement.classList.remove("hidden");
    outputElement.classList.add("hidden");
    outputElement.innerHTML = "";
    if (buttonElement) buttonElement.disabled = true;

    try {
      const response = await fetch(geminiApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const result = await response.json();

      if (response.ok && result.reply) {
        // Ganti newline dengan <br> untuk tampilan HTML
        outputElement.innerHTML = `<p>${result.reply.replace(
          /\n/g,
          "<br>"
        )}</p>`;
      } else {
        console.error("Unexpected response from Gemini API:", result);
        outputElement.innerHTML = `<p class='text-red-500'>Gagal mendapatkan respon yang valid dari AI. ${
          result.error || ""
        }</p>`;
      }
      outputElement.classList.remove("hidden");
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      outputElement.innerHTML = `<p class='text-red-500'>Gagal memanggil AI: ${error.message}</p>`;
      outputElement.classList.remove("hidden");
    } finally {
      if (loadingElement) loadingElement.classList.add("hidden");
      if (buttonElement) buttonElement.disabled = false;
    }
  }

  // Event Listener: Ide Kegiatan Desa
  const generateActivityIdeaBtn = document.getElementById(
    "generateActivityIdeaBtn"
  );
  if (generateActivityIdeaBtn) {
    generateActivityIdeaBtn.addEventListener("click", () => {
      const prompt =
        "Berikan 3 ide kegiatan atau program pengembangan yang inovatif dan cocok untuk sebuah desa di Aceh seperti Gampong Meunasah Blang. Fokus pada kegiatan yang dapat meningkatkan kesejahteraan warga, memanfaatkan potensi lokal (pertanian, perikanan, budaya), dan mempererat kebersamaan komunitas. Sertakan juga potensi tantangan dan solusi singkat untuk setiap ide.";
      callGeminiAPI(
        prompt,
        "activityIdeaResult",
        "activityIdeaLoading",
        generateActivityIdeaBtn
      );
    });
  } else {
    console.warn("Button 'generateActivityIdeaBtn' not found.");
  }

  // Event Listener: Ringkas Berita
  const summarizeNewsBtn = document.getElementById("summarizeNewsBtn");
  const sakdiahStoryTextElement = document.getElementById("sakdiahStoryText");
  if (summarizeNewsBtn && sakdiahStoryTextElement) {
    summarizeNewsBtn.addEventListener("click", () => {
      const storyText = sakdiahStoryTextElement.innerText;
      const prompt = `Ringkaslah teks berikut dalam 2-3 kalimat singkat dan padat, menyoroti poin utama tentang Ibu Sakdiah Ismail:\n\n"${storyText}"`;
      callGeminiAPI(
        prompt,
        "newsSummaryResult",
        "newsSummaryLoading",
        summarizeNewsBtn
      );
    });
  } else {
    console.warn(
      "Button 'summarizeNewsBtn' or text 'sakdiahStoryTextElement' not found."
    );
  }

  // Event Listener: Tanya Jawab Seputar Aceh
  const askAcehQuestionBtn = document.getElementById("askAcehQuestionBtn");
  const acehQuestionInput = document.getElementById("acehQuestionInput");
  if (askAcehQuestionBtn && acehQuestionInput) {
    askAcehQuestionBtn.addEventListener("click", () => {
      const question = acehQuestionInput.value.trim();
      const outputElement = document.getElementById("acehQuestionResult"); // Definisikan di sini untuk pesan error
      if (!outputElement) {
        console.error("Output element 'acehQuestionResult' not found.");
        return;
      }

      if (question) {
        const prompt = `Jawab pertanyaan berikut tentang Aceh dengan informatif dan ringkas. Jika pertanyaan di luar konteks Aceh atau tidak pantas, berikan respons yang sopan dan netral:\n\n"${question}"`;
        callGeminiAPI(
          prompt,
          "acehQuestionResult",
          "acehQuestionLoading",
          askAcehQuestionBtn
        );
      } else {
        outputElement.innerHTML =
          "<p class='text-amber-600'>Silakan masukkan pertanyaan Anda terlebih dahulu.</p>";
        outputElement.classList.remove("hidden");
      }
    });
  } else {
    console.warn(
      "Button 'askAcehQuestionBtn' or input 'acehQuestionInput' not found."
    );
  }

  // --- OpenWeatherMap API Integration ---
  const weatherApiKey = "MASUKKAN_API_KEY_ANDA_DI_SINI"; // Ganti dengan API Key Anda
  const weatherCity = "Banda Aceh";
  const weatherLoadingElement = document.getElementById("weather-loading");
  const weatherDataContainer = document.getElementById("weather-data");

  if (weatherApiKey && weatherApiKey !== "MASUKKAN_API_KEY_ANDA_DI_SINI") {
    if (weatherLoadingElement && weatherDataContainer) {
      fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
          weatherCity
        )},ID&appid=${weatherApiKey}&units=metric&lang=id`
      )
        .then((response) => {
          if (!response.ok)
            throw new Error(
              `Gagal mengambil data cuaca (status: ${response.status})`
            );
          return response.json();
        })
        .then((data) => {
          const weatherDescEl = document.getElementById("weather-desc");
          const weatherTempEl = document.getElementById("weather-temp");
          const weatherHumidityEl = document.getElementById("weather-humidity");
          const weatherWindEl = document.getElementById("weather-wind");

          if (weatherDescEl)
            weatherDescEl.textContent = data.weather[0].description;
          if (weatherTempEl) weatherTempEl.textContent = data.main.temp;
          if (weatherHumidityEl)
            weatherHumidityEl.textContent = data.main.humidity;
          if (weatherWindEl)
            weatherWindEl.textContent = (data.wind.speed * 3.6).toFixed(1); // m/s to km/h

          weatherLoadingElement.classList.add("hidden");
          weatherDataContainer.classList.remove("hidden");
        })
        .catch((error) => {
          console.error("Error fetching weather data:", error);
          if (weatherLoadingElement)
            weatherLoadingElement.textContent = `Terjadi kesalahan: ${error.message}`;
          weatherDataContainer.classList.add("hidden");
        });
    } else {
      console.warn("Elemen untuk tampilan cuaca tidak ditemukan.");
    }
  } else {
    if (weatherLoadingElement) {
      weatherLoadingElement.textContent =
        "API Key OpenWeatherMap belum dimasukkan. Fitur cuaca tidak aktif.";
      weatherLoadingElement.classList.remove("hidden"); // Pastikan pesan ini terlihat
    }
    if (weatherDataContainer) weatherDataContainer.classList.add("hidden");
    console.warn("API Key OpenWeatherMap tidak valid atau belum dimasukkan.");
  }
});

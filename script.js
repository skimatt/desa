document.addEventListener("DOMContentLoaded", function () {
  // Utility function to toggle visibility
  function toggleVisibility(element, isVisible, className = "hidden") {
    if (element) {
      element.classList.toggle(className, !isVisible);
    }
  }

  // Utility function to display user-friendly error messages
  function showUserError(elementId, message) {
    const container = document.getElementById(elementId);
    if (container) {
      container.innerHTML = `<p class="text-amber-600">${message}</p>`;
      toggleVisibility(container, true);
    }
  }

  // Utility function to clean API response text (remove markdown)
  function cleanResponseText(text) {
    return text
      .replace(/\*\*([^*]+)\*\*/g, "$1") // Remove **bold**
      .replace(/\*([^*]+)\*/g, "$1") // Remove *italic*
      .replace(/[-*]{1,2}\s/g, "") // Remove list markers
      .replace(/\n/g, "<br>"); // Convert newlines to <br>
  }

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
        toggleVisibility(mobileMenu, false);
        toggleVisibility(hamburgerIcon, true);
        toggleVisibility(closeIcon, false);
        mobileMenuButton.setAttribute("aria-expanded", "false");
      });
    });
  } else {
    console.error("Elemen menu mobile tidak ditemukan.");
    showUserError("mobile-menu", "Maaf, menu mobile tidak tersedia saat ini.");
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
      if (
        hrefAttribute &&
        hrefAttribute.length > 1 &&
        hrefAttribute.startsWith("#")
      ) {
        try {
          const targetElement = document.querySelector(hrefAttribute);
          if (targetElement) {
            e.preventDefault();
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
          console.warn(`Smooth scroll gagal untuk: ${hrefAttribute}`, error);
        }
      } else if (hrefAttribute === "#") {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  });

  // --- Accordion for Public Services ---
  const accordionHeaders = document.querySelectorAll(".accordion-header");
  accordionHeaders.forEach((header, index) => {
    const content = header.nextElementSibling;
    if (content) {
      content.id = content.id || `accordion-content-${index}`;
      header.setAttribute("aria-controls", content.id);
      header.setAttribute("aria-expanded", "false");
      header.setAttribute("tabindex", "0"); // Make header focusable
    }

    header.addEventListener("click", () => toggleAccordion(header, content));
    header.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleAccordion(header, content);
      }
    });
  });

  function toggleAccordion(header, content) {
    const wasActive = header.classList.contains("active");
    document
      .querySelectorAll(".accordion-header.active")
      .forEach((activeHeader) => {
        if (activeHeader !== header) {
          activeHeader.classList.remove("active");
          activeHeader.setAttribute("aria-expanded", "false");
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

    header.classList.toggle("active");
    header.setAttribute("aria-expanded", !wasActive);
    if (content && content.classList.contains("accordion-content")) {
      content.style.maxHeight = wasActive ? null : `${content.scrollHeight}px`;
      content.classList.toggle("open", !wasActive);
    }
  }

  // --- Gemini API Integration ---
  const geminiApiUrl = "https://gemini.rahmatyoung10.workers.dev/";

  async function callGeminiAPI(
    prompt,
    outputElementId,
    loadingElementId,
    buttonElement,
    retries = 2
  ) {
    const outputElement = document.getElementById(outputElementId);
    const loadingElement = document.getElementById(loadingElementId);

    if (!outputElement || !loadingElement) {
      console.error(
        `Element missing: outputElementId='${outputElementId}', loadingElementId='${loadingElementId}'`
      );
      showUserError(
        outputElementId,
        "Maaf, layanan ini sedang tidak tersedia. Silakan coba lagi nanti."
      );
      return;
    }

    toggleVisibility(loadingElement, true);
    toggleVisibility(outputElement, false);
    outputElement.innerHTML = "";
    if (buttonElement) buttonElement.disabled = true;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(geminiApiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });

        const result = await response.json();

        if (response.ok && result.reply) {
          outputElement.innerHTML = `<p>${cleanResponseText(result.reply)}</p>`;
          toggleVisibility(outputElement, true);
          break;
        } else {
          throw new Error(result.error || "Respon AI tidak valid");
        }
      } catch (error) {
        console.error(`Percobaan ${attempt} gagal:`, error);
        if (attempt === retries) {
          showUserError(
            outputElementId,
            "Maaf, ada kendala dalam menghubungi layanan AI. Silakan coba lagi nanti."
          );
          toggleVisibility(outputElement, true);
        }
      }
    }

    toggleVisibility(loadingElement, false);
    if (buttonElement) buttonElement.disabled = false;
  }

  // Event Listener: Ide Kegiatan Desa
  const generateActivityIdeaBtn = document.getElementById(
    "generateActivityIdeaBtn"
  );
  if (generateActivityIdeaBtn) {
    generateActivityIdeaBtn.addEventListener("click", () => {
      const prompt =
        "Berikan 3 ide kegiatan atau program pengembangan yang inovatif untuk desa di Aceh seperti Gampong Meunasah Blang. Fokus pada potensi lokal seperti pertanian padi basah, perikanan laut, atau kerajinan songket, sambil memperkuat nilai keislaman dan kebersamaan komunitas. Jawab dalam bahasa sederhana tanpa tanda bintang atau format penekanan. Sertakan potensi tantangan dan solusi singkat untuk setiap ide.";
      callGeminiAPI(
        prompt,
        "activityIdeaResult",
        "activityIdeaLoading",
        generateActivityIdeaBtn
      );
    });
  } else {
    console.warn("Button 'generateActivityIdeaBtn' not found.");
    showUserError(
      "activityIdeaResult",
      "Maaf, fitur ide kegiatan desa tidak tersedia saat ini."
    );
  }

  // Event Listener: Ringkas Berita
  const summarizeNewsBtn = document.getElementById("summarizeNewsBtn");
  const sakdiahStoryTextElement = document.getElementById("sakdiahStoryText");
  if (summarizeNewsBtn && sakdiahStoryTextElement) {
    summarizeNewsBtn.addEventListener("click", () => {
      const storyText = sakdiahStoryTextElement.innerText;
      const prompt = `Ringkaslah teks berikut dalam 2-3 kalimat singkat dan padat, menyoroti poin utama tentang Ibu Sakdiah Ismail. Gunakan bahasa sederhana tanpa tanda bintang atau format penekanan:\n\n"${storyText}"`;
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
    showUserError(
      "newsSummaryResult",
      "Maaf, fitur ringkas berita tidak tersedia saat ini."
    );
  }

  // Event Listener: Tanya Jawab Seputar Aceh
  const askAcehQuestionBtn = document.getElementById("askAcehQuestionBtn");
  const acehQuestionInput = document.getElementById("acehQuestionInput");
  if (askAcehQuestionBtn && acehQuestionInput) {
    askAcehQuestionBtn.addEventListener("click", () => {
      const question = acehQuestionInput.value.trim();
      const outputElement = document.getElementById("acehQuestionResult");
      if (!outputElement) {
        console.error("Output element 'acehQuestionResult' not found.");
        showUserError(
          "acehQuestionResult",
          "Maaf, fitur tanya jawab tidak tersedia saat ini."
        );
        return;
      }

      if (question) {
        const prompt = `Jawab pertanyaan berikut tentang Aceh dengan informatif, ringkas, dan dalam bahasa sederhana tanpa tanda bintang atau format penekanan lainnya. Jika pertanyaan di luar konteks Aceh atau tidak pantas, berikan respons sopan dan netral:\n\n"${question}"`;
        callGeminiAPI(
          prompt,
          "acehQuestionResult",
          "acehQuestionLoading",
          askAcehQuestionBtn
        );
      } else {
        outputElement.innerHTML = `<p class="text-amber-600">Silakan masukkan pertanyaan Anda terlebih dahulu.</p>`;
        toggleVisibility(outputElement, true);
      }
    });
  } else {
    console.warn(
      "Button 'askAcehQuestionBtn' or input 'acehQuestionInput' not found."
    );
    showUserError(
      "acehQuestionResult",
      "Maaf, fitur tanya jawab tidak tersedia saat ini."
    );
  }

  // --- OpenWeatherMap API Integration ---
  const weatherApiKey = process.env.WEATHER_API_KEY || "";
  const weatherCity = "Banda Aceh";
  const weatherLoadingElement = document.getElementById("weather-loading");
  const weatherDataContainer = document.getElementById("weather-data");

  if (weatherApiKey) {
    if (weatherLoadingElement && weatherDataContainer) {
      fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
          weatherCity
        )},ID&appid=${weatherApiKey}&units=metric&lang=id`
      )
        .then((response) => {
          if (!response.ok) throw new Error("Gagal mengambil data cuaca");
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
            weatherWindEl.textContent = (data.wind.speed * 3.6).toFixed(1);

          toggleVisibility(weatherLoadingElement, false);
          toggleVisibility(weatherDataContainer, true);
        })
        .catch((error) => {
          console.error("Error fetching weather data:", error);
          showUserError(
            "weather-loading",
            "Maaf, data cuaca tidak dapat ditampilkan saat ini."
          );
          toggleVisibility(weatherDataContainer, false);
        });
    } else {
      console.warn("Elemen untuk tampilan cuaca tidak ditemukan.");
      showUserError("weather-loading", "Maaf, fitur cuaca tidak tersedia.");
    }
  } else {
    console.warn("API Key OpenWeatherMap tidak ditemukan.");
    showUserError(
      "weather-loading",
      "Fitur cuaca tidak aktif karena kunci API belum dikonfigurasi."
    );
    toggleVisibility(weatherDataContainer, false);
  }
});

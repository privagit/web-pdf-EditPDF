$(document).ready(function () {
  $("#getUploadedPDF").on("click", function () {
    document.getElementById("uploadPDF").click();
  });

  $("#uploadPDF").on("change", function () {
    const fileInput = $("#uploadPDF")[0];
    const file = fileInput.files[0];

    const reader = new FileReader();
    reader.onload = function (e) {
      const pdfData = e.target.result;
      console.log("file :>> ", file);

      // Store PDF data  insessionStorage
      sessionStorage.setItem("uploadedPDF", pdfData);
      sessionStorage.setItem("FileName", file.name);
      console.log("PDF uploaded and stored in sessionSorage.");

      // Redirect to main_2.html after file upload
      window.location.href = "EditPDF";
    };
    reader.readAsDataURL(file);
  });

  const elements = document.querySelectorAll(".eyes_animate");

  elements.forEach((element) => {
    function startAnimation() {
      element.style.animation = "eyes 0.2s linear";
      element.addEventListener(
        "animationend",
        () => {
          element.style.animation = "none";
          setTimeout(startAnimation, 5000); // Delay 5 seconds
        },
        { once: true }
      );
    }

    startAnimation();

    const catSleepingElements = document.querySelectorAll(".catSleeping");
    catSleepingElements.forEach((element, index) => {
      element.style.setProperty("--animation-delay", `${index * 1}s`); // เพิ่มค่า delay เป็น 1 วินาที
    });
  });
});

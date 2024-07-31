
$(document).ready(function () {

    $("#getUploadedPDF").on("click", function () {
        document.getElementById('uploadPDF').click();
    })

    $("#uploadPDF").on("change", function () {
        const fileInput = $("#uploadPDF")[0];
        const file = fileInput.files[0];

        const reader = new FileReader();
        reader.onload = function (e) {
            const pdfData = e.target.result;
            console.log('file :>> ', file);

            // Store PDF data  insessionStorage
            sessionStorage.setItem('uploadedPDF', pdfData);
            sessionStorage.setItem('FileName', file.name);
            console.log('PDF uploaded and stored in sessionSorage.');

            // Redirect to main_2.html after file upload
            window.location.href = 'EditPDF';
        };
        reader.readAsDataURL(file);
    });
});


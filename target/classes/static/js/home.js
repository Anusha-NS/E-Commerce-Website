
document.addEventListener('DOMContentLoaded', function () {

    // =====================================
    // 1. UPDATE CART COUNT
    // =====================================

    updateCartCount();


    // =====================================
    // 2. ADD TO CART
    // =====================================

    document.querySelectorAll('.add-to-cart-btn').forEach(button => {

        button.addEventListener('click', function () {

            const productId = this.getAttribute('data-product-id');

            console.log("Product ID:", productId);

            if (!productId) {
                console.error("Product ID is missing from the button");
                return;
            }

            addToCart(productId);

        });

    });


    // =====================================
    // 3. PRODUCT SEARCH
    // =====================================

    const searchInput = document.getElementById('searchInput');

    if (searchInput) {

        searchInput.addEventListener('input', function () {

            const searchQuery = searchInput.value.toLowerCase();

            const productCards = document.querySelectorAll('.product-card');

            productCards.forEach(card => {

                const productName =
                    (card.getAttribute('data-name') || '').toLowerCase();

                if (productName.includes(searchQuery)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }

            });

        });

    }


    // =====================================
    // 4. CONTACT FORM
    // =====================================

    const contactForm = document.getElementById('contactForm');

    if (contactForm) {

        contactForm.addEventListener('submit', function (event) {

            event.preventDefault();

            const form = event.target;
            const formData = new FormData(form);

            fetch(form.action, {
                method: 'POST',
                body: formData
            })

            .then(response => response.json())

            .then(data => {

                if (data.success) {

                    const formMessage =
                        document.getElementById('formMessage');

                    if (formMessage) {

                        formMessage.innerText = data.success;
                        formMessage.style.display = 'block';

                        setTimeout(() => {
                            formMessage.style.display = 'none';
                        }, 5000);

                    }

                    form.reset();

                }

            })

            .catch(error => {
                console.error('Contact form error:', error);
            });

        });

    }


    // =====================================
    // 5. APPLY DISCOUNT
    // =====================================

    document.querySelectorAll('.apply-discount-btn').forEach(button => {

        button.addEventListener('click', function () {

            const currentButton = this;

            const isAvailable =
                currentButton.getAttribute('data-discount-available') === 'true';

            const discountSection =
                document.querySelector('.discount-section');

            let messageElement =
                document.getElementById('discount-message');

            if (!messageElement && discountSection) {

                messageElement = document.createElement('p');
                messageElement.id = 'discount-message';

                discountSection.appendChild(messageElement);

            }

            if (!messageElement) {
                console.error('Discount message element not found');
                return;
            }

            messageElement.style.textAlign = 'center';
            messageElement.style.fontWeight = 'bold';
            messageElement.style.fontSize = '18px';

            // Check offer availability

            if (!isAvailable) {

                messageElement.textContent = 'Offer expired.';
                messageElement.style.color = 'red';

                return;

            }

            // Prevent repeated clicks while processing

            if (currentButton.disabled) {
                return;
            }

            currentButton.disabled = true;

            // Send request to backend

            fetch('/discount/apply', {

                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                }

            })

            .then(response => {

                if (!response.ok) {
                    throw new Error('Server error: ' + response.status);
                }

                return response.json();

            })

            .then(data => {

                if (data.status === 'success') {

                    const discountPercentage =
                        Number(data.discountPercentage);

                    // Update homepage product prices

                    document.querySelectorAll('.product-card').forEach(card => {

                        const priceElement =
                            card.querySelector('.original-price');

                        if (!priceElement) {
                            return;
                        }

                        // Preserve original price only once

                        if (!priceElement.dataset.originalPrice) {

                            priceElement.dataset.originalPrice =
                                priceElement.textContent.replace(/[^0-9.-]+/g, '');

                        }

                        const originalPrice =
                            parseFloat(priceElement.dataset.originalPrice);

                        if (isNaN(originalPrice)) {
                            return;
                        }

                        const discountedPrice =
                            originalPrice -
                            (originalPrice * discountPercentage / 100);

                        priceElement.innerHTML = `
                            <del>₹${originalPrice.toFixed(2)}</del>

                            <span style="color:green;font-weight:bold;">
                                ${discountPercentage}% OFF
                                ₹${discountedPrice.toFixed(2)}
                            </span>
                        `;

                    });

                    messageElement.textContent = data.message;
                    messageElement.style.color = 'green';

                    currentButton.textContent = 'Discount Applied';

                } else {

                    messageElement.textContent = data.message;
                    messageElement.style.color = 'red';

                }

            })

            .catch(error => {

                console.error('Discount error:', error);

                messageElement.textContent =
                    'Unable to apply discount. Please try again.';

                messageElement.style.color = 'red';

            })

            .finally(() => {

                currentButton.disabled = false;

            });

        });

    });


    // =====================================
    // 6. OPEN AND CLOSE DISCOUNT SECTION
    // =====================================

    const discountLink =
        document.getElementById('discount-link');

    const discountSection =
        document.getElementById('discount-section');

    if (discountLink && discountSection) {

        discountLink.addEventListener('click', function (event) {

            event.preventDefault();

            if (window.getComputedStyle(discountSection).display === 'none') {

                discountSection.style.display = 'block';

            } else {

                discountSection.style.display = 'none';

            }

        });

    } else {

        console.error('Discount link or discount section not found!');

    }


    // =====================================
    // 7. HIDE WELCOME MESSAGE
    // =====================================

    const welcomeMessage =
        document.getElementById('welcome-msg');

    if (welcomeMessage) {

        setTimeout(function () {

            welcomeMessage.style.display = 'none';

        }, 3000);

    }

});


// =====================================
// 8. ADD PRODUCT TO CART FUNCTION
// =====================================

function addToCart(productId) {

    fetch('/cart/add', {

        method: 'POST',

        headers: {
            'Content-Type': 'application/json'
        },

        body: JSON.stringify({
            productId: parseInt(productId)
        })

    })

    .then(response => response.json())

    .then(data => {

        if (data.status === "success" || data.status === "info") {

            updateCartCount();

            displayCartMessage(data.message);

        } else {

            console.error(data.message);

        }

    })

    .catch(error => {

        console.error('Error adding product to cart:', error);

    });

}


// =====================================
// 9. UPDATE CART COUNT FUNCTION
// =====================================

function updateCartCount() {

    fetch('/cart/count')

    .then(response => response.json())

    .then(data => {

        const cartCountElement =
            document.getElementById('cart-count');

        if (cartCountElement) {

            cartCountElement.innerText = data.count;

        }

    })

    .catch(error => {

        console.error('Error fetching cart count:', error);

    });

}


// =====================================
// 10. DISPLAY CART MESSAGE FUNCTION
// =====================================

function displayCartMessage(message) {

    const cartMessage =
        document.getElementById('cart-message');

    if (cartMessage) {

        cartMessage.innerText = message;

        cartMessage.style.display = 'block';
        cartMessage.style.opacity = '1';

        setTimeout(() => {

            cartMessage.style.opacity = '0';

            setTimeout(() => {

                cartMessage.style.display = 'none';

            }, 300);

        }, 3000);

    }

}

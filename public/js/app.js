document.addEventListener("DOMContentLoaded", () => {


    /* =====================================
       PAGE NAVIGATION
    ===================================== */

    const navItems =
        document.querySelectorAll(".nav-item");

    const pages =
        document.querySelectorAll(".page");

    const pageTitle =
        document.getElementById("pageTitle");


    const titles = {

        home:
            "Good morning, Soham.",

        study:
            "Study Buddy",

        cart:
            "Campus Cart",

        messages:
            "Your messages",

        saved:
            "Your saved things",

        profile:
            "Your campus profile"

    };


    function openPage(pageName) {

        pages.forEach(page => {

            page.classList.remove("active");

        });


        const target =
            document.getElementById(pageName);


        if (target) {

            target.classList.add("active");

        }


        navItems.forEach(item => {

            item.classList.toggle(
                "active",
                item.dataset.page === pageName
            );

        });


        if (pageTitle) {

            pageTitle.textContent =
                titles[pageName] ||
                "CampusConnect";

        }


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }


    navItems.forEach(item => {

        item.addEventListener(
            "click",
            () => {

                openPage(
                    item.dataset.page
                );

            }
        );

    });


    /* =====================================
       HERO / MODULE NAVIGATION
    ===================================== */

    document
        .querySelectorAll("[data-go]")
        .forEach(element => {

            element.addEventListener(
                "click",
                () => {

                    openPage(
                        element.dataset.go
                    );

                }
            );

        });


    /* =====================================
       QUESTION MODAL
    ===================================== */

    const questionModal =
        document.getElementById(
            "questionModal"
        );


    const askQuestionButton =
        document.getElementById(
            "askQuestionButton"
        );


    if (askQuestionButton) {

        askQuestionButton.addEventListener(
            "click",
            () => {

                questionModal.classList.add(
                    "show"
                );

            }
        );

    }


    /* =====================================
       SELL MODAL
    ===================================== */

    const sellModal =
        document.getElementById(
            "sellModal"
        );


    const sellItemButton =
        document.getElementById(
            "sellItemButton"
        );


    if (sellItemButton) {

        sellItemButton.addEventListener(
            "click",
            () => {

                sellModal.classList.add(
                    "show"
                );

            }
        );

    }


    /* =====================================
       CLOSE MODALS
    ===================================== */

    document
        .querySelectorAll("[data-close]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    questionModal.classList.remove(
                        "show"
                    );

                    sellModal.classList.remove(
                        "show"
                    );

                }
            );

        });


    document
        .querySelectorAll(".modal-overlay")
        .forEach(overlay => {

            overlay.addEventListener(
                "click",
                event => {

                    if (
                        event.target === overlay
                    ) {

                        overlay.classList.remove(
                            "show"
                        );

                    }

                }
            );

        });


    /* =====================================
       ESCAPE CLOSE
    ===================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (event.key === "Escape") {

                questionModal.classList.remove(
                    "show"
                );

                sellModal.classList.remove(
                    "show"
                );

            }

        }
    );


    /* =====================================
       QUESTION SEARCH
    ===================================== */

    const questionSearch =
        document.getElementById(
            "questionSearch"
        );


    if (questionSearch) {

        questionSearch.addEventListener(
            "input",
            () => {

                const query =
                    questionSearch.value
                    .toLowerCase()
                    .trim();


                document
                    .querySelectorAll(
                        ".large-question"
                    )
                    .forEach(question => {

                        const text =
                            question.textContent
                            .toLowerCase();


                        question.style.display =
                            text.includes(query)
                            ? ""
                            : "none";

                    });

            }
        );

    }


    /* =====================================
       SUBJECT FILTER
    ===================================== */

    const subjectFilter =
        document.getElementById(
            "subjectFilter"
        );


    if (subjectFilter) {

        subjectFilter.addEventListener(
            "change",
            () => {

                const value =
                    subjectFilter.value;


                document
                    .querySelectorAll(
                        ".large-question"
                    )
                    .forEach(question => {

                        if (value === "all") {

                            question.style.display =
                                "";

                            return;

                        }


                        const pill =
                            question.querySelector(
                                ".subject-pill"
                            );


                        if (!pill) return;


                        const subject =
                            pill.textContent
                            .toLowerCase();


                        question.style.display =
                            subject.includes(value)
                            ? ""
                            : "none";

                    });

            }
        );

    }


    /* =====================================
       CART CATEGORIES
    ===================================== */

    const categories =
        document.querySelectorAll(
            ".category"
        );


    categories.forEach(category => {

        category.addEventListener(
            "click",
            () => {

                categories.forEach(item => {

                    item.classList.remove(
                        "active"
                    );

                });


                category.classList.add(
                    "active"
                );

            }
        );

    });


    /* =====================================
       PRODUCT SEARCH
    ===================================== */

    const productSearch =
        document.getElementById(
            "productSearch"
        );


    if (productSearch) {

        productSearch.addEventListener(
            "input",
            () => {

                const query =
                    productSearch.value
                    .toLowerCase()
                    .trim();


                document
                    .querySelectorAll(
                        ".product-card"
                    )
                    .forEach(product => {

                        const text =
                            product.textContent
                            .toLowerCase();


                        product.style.display =
                            text.includes(query)
                            ? ""
                            : "none";

                    });

            }
        );

    }


    /* =====================================
       HEART / SAVE BUTTONS
    ===================================== */

    document
        .querySelectorAll(".heart")
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.stopPropagation();


                    if (
                        button.textContent
                        .trim() === "♡"
                    ) {

                        button.textContent =
                            "♥";

                        button.style.color =
                            "#9c5b78";

                    } else {

                        button.textContent =
                            "♡";

                        button.style.color =
                            "";

                    }

                }
            );

        });


    /* =====================================
       CONTACT SELLER
    ===================================== */

    document
        .querySelectorAll(
            ".contact-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    openPage("messages");

                }
            );

        });


    /* =====================================
       TABS
    ===================================== */

    document
        .querySelectorAll(".tab")
        .forEach(tab => {

            tab.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".tab"
                        )
                        .forEach(item => {

                            item.classList.remove(
                                "active"
                            );

                        });


                    tab.classList.add(
                        "active"
                    );

                }
            );

        });


    /* =====================================
       MOBILE MENU
    ===================================== */

    const mobileMenu =
        document.getElementById(
            "mobileMenu"
        );


    if (mobileMenu) {

        mobileMenu.addEventListener(
            "click",
            () => {

                alert(
                    "Open the desktop navigation or continue using the mobile interface."
                );

            }
        );

    }


    /* =====================================
       DEMO FORM SUBMISSION
    ===================================== */

    document
        .querySelectorAll(
            ".modal .button.full"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const modal =
                        button.closest(
                            ".modal-overlay"
                        );


                    if (modal) {

                        modal.classList.remove(
                            "show"
                        );

                    }


                    setTimeout(() => {

                        alert(
                            "Demo action completed! " +
                            "Next step is connecting this form to your Express API."
                        );

                    }, 150);

                }
            );

        });

});
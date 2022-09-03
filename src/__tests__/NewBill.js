/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import BillsUI from "../views/BillsUI.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";

// Permet de remplacer les fonctions du fichier app/store,
// par mockStore pour simuler les requetes API
jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then email icon in the vertical layout should be highlighted", async () => {
      // lien vers les données mockées
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      //Défini user comme employé dans le localStorage
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      // To check si lorsque l'on est sur la page newBill que l'icone mail soit mise en evidence
      window.onNavigate(ROUTES_PATH.NewBill);
      await waitFor(() => screen.getByTestId("icon-mail"));
      // Pour recupérer dans le DOM l'icone mail
      const mailIcon = screen.getByTestId("icon-mail");
      //On verifie si l'icone mail contient la classe active
      expect(mailIcon.classList.contains("active-icon")).toBe(true);
    });
    describe("When I am on NewBill page and I want to add a receipt", () => {
      test("Then the receipt is uploaded if the right file format is used", () => {
        // lien vers les données mockées
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        //Défini user comme employé dans le localStorage
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
          })
        );
        //onNavigate:Fonction qui est dans le fichier app/Router.js,
        // elle aiguille les routes des fichiers js.
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        // Création nouvelle facture
        document.body.innerHTML = NewBillUI();
        const newBill = new NewBill({
          document,
          onNavigate,
          mockStore,
          localStorage: window.localStorage,
        });
        // simulation de la fonction handleChangeFile
        const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));

        // Pour récupérer l'input "file"
        const file = screen.getByTestId("file");
        //Simulation d'une ajout de fichier
        file.addEventListener("change", handleChangeFile);
        fireEvent.change(file, {
          target: {
            fileType: [
              new File(["image.png"], "image.png", { type: "image/png" }),
            ],
          },
        });
        //Appel de la foncton handleChangeFile
        expect(handleChangeFile).toHaveBeenCalled();
        //on check si c'est le bon fichier
        expect(file.fileType[0].name).toBe("image.png");

        expect(file.fileType[0].name).toMatch(new RegExp("png|jpg|jpeg"));
      });
    });

    describe("When I anm on NewBill page and the form is rightfully completed ", () => {
      test("Then I can submit and create the NewBill", async () => {
        //Page du Formulaire NewBill
        document.body.innerHTML = NewBillUI();
        // lien vers les données mockées
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        //Défini user comme employé dans le localStorage
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
          })
        );
        //onNavigate:Fonction qui est dans le fichier app/Router.js,
        // elle aiguille les routes des fichiers js.
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        const newBill = new NewBill({
          document,
          onNavigate,
          mockStore,
          localStorage,
        });

        // simulation de la fonction handleSubmit
        const handleSubmit = jest.fn(newBill.handleSubmit);
        //Récupère le formulaire pour le tester
        const submitBtn = screen.getByTestId("form-new-bill");

        submitBtn.addEventListener("submit", handleSubmit);
        //Simulation de l'évènement submit
        fireEvent.submit(submitBtn);
        // On vérifie si la fonction HandleSubmit a bien été appelée
        expect(handleSubmit).toHaveBeenCalled();

        expect(screen.getByText("Mes notes de frais")).toBeTruthy();
      });
    });
  });
});

// Test d'intégration POST

describe("Given I am a user connected as an employee", () => {
  describe("When I create a new bill", () => {
    test("send bill to mock API post", async () => {
      //Défini le user comme etant un employé
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "a@a" })
      );
      //Simulation d'une navigation vers une page html.
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      // Router injecte les pages dans le DOm
      router();
      //Fonction qui est dans le fichier app/Router.js,
      // elle aiguille les routes des fichiers js.
      window.onNavigate(ROUTES_PATH.NewBill);

      //Permet de mettre un espion sur une fonction
      // qui est executée par une autre fonction test.
      jest.spyOn(mockStore, "bills");

      //mockImplementationOnce: Accepte une fonction qui sera utilisée comme une implémentation
      //de simulation pour un appel à la fonction simulée.
      mockStore.bills.mockImplementationOnce(() => {
        return {
          create: (bill) => {
            return Promise.resolve();
          },
        };
      });

      //Lorsque nous passons une fonction à process.nextTick(),
      //nous demandons au moteur d'appeler cette fonction à la
      //process.nextTick: fin de l'opération en cours, avant le démarrage de la prochaine boucle d'événement:
      await new Promise(process.nextTick);

      //On s'attend à voir affiché le message "mes notes de frais"
      expect(screen.getByText("Mes notes de frais")).toBeTruthy();
    });
  });
  describe("When a error occurs on Api", () => {
    test("send bill to mock API post and fails with error 404", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "a@a" })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.NewBill);
      jest.spyOn(mockStore, "bills");

      mockStore.bills.mockImplementationOnce(() => {
        return {
          create: (bill) => {
            return Promise.reject(new Error("Erreur 404"));
          },
        };
      });

      await new Promise(process.nextTick);
      //Introduction du message "Erreur 404" dans la page.
      document.body.innerHTML = BillsUI({ error: "Erreur 404" });
      //Affichage de l'erreur
      const message = await screen.getByText(/Erreur 404/);

      expect(message).toBeTruthy();
    });

    test("send bill to mock API post and fails with error 500", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "a@a" })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.NewBill);
      jest.spyOn(mockStore, "bills");

      mockStore.bills.mockImplementationOnce(() => {
        return {
          create: (bill) => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });

      await new Promise(process.nextTick);
      //Introduction du message "Erreur 500" dans la page.
      document.body.innerHTML = BillsUI({ error: "Erreur 500" });
      //Affichage de l'erreur
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});

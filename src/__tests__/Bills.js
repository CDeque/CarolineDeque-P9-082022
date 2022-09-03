/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";
import Bills from "../containers/Bills.js";
import userEvent from "@testing-library/user-event";

// Permet de remplacer les fonctions du fichier app/store,
// par mockStore pour simuler les requetes API
jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
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
      // To check si lorsque l'on est sur la page newBill
      //que l'icone mail soit mise en evidence
      window.onNavigate(ROUTES_PATH.Bills);

      await waitFor(() => screen.getByTestId("icon-window"));
      // Pour recupérer dans le DOM l'icone mail
      const windowIcon = screen.getByTestId("icon-window");
      //to-do write expect expression

      // Expect added, to check if  icon is highlighted  and contains class active-icon
      expect(windowIcon.classList.contains("active-icon")).toBe(true);
    });

    test("Then bills should be ordered from earliest to latest", () => {
      //afficher les données du fichier views/billsUI
      document.body.innerHTML = BillsUI({ data: bills });

      //regex de format date
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });
  // test add new bill handleClick
  describe("When I click on new bill button", () => {
    test("It should open new bill modal form", () => {
      //aiguille les routes des fichiers js.
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      // Création de facture
      const bills = new Bills({
        document,
        onNavigate,
        mockStore,
        localStorage,
      });
      //Simulation de la fonction handleClickNewBill
      const handleClickNewBill = jest.fn((e) => bills.handleClickNewBill(e));
      //getByTestId va faire une requête ds le DOM:récupère des éléments via l’attribut data-testid
      const newBillBtn = screen.getByTestId("btn-new-bill");

      newBillBtn.addEventListener("click", handleClickNewBill);
      //Génère l'événement
      userEvent.click(newBillBtn);
      // On s'attend a ce qle la fonction "handleClickNewBill" soit appélée
      expect(handleClickNewBill).toHaveBeenCalled();
      //On s'attend à voir le texte "Envoyer".
      expect(screen.queryByText("Envoyer")).toBeTruthy();
    });
  });
  describe("When I click on eye con button", () => {
    test("It should open bill receipt", () => {
      //aiguille les routes des fichiers js.
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      document.body.innerHTML = BillsUI({ data: bills });
      //Création d'un objet facture
      const receipt = new Bills({
        document,
        onNavigate,
        bills,
        mockStore,
        localStorage: window.localStorage,
      });
      $.fn.modal = jest.fn();
      // get all eye icons
      const eyeIcon = screen.getAllByTestId("icon-eye");
      // boucle pour checker chaque icone
      eyeIcon.forEach((icon) => {
        const handleClickIconEye = jest.fn(() =>
          receipt.handleClickIconEye(icon)
        );

        icon.addEventListener("click", handleClickIconEye);
        // On simule le clic
        userEvent.click(icon);
        // On  s'attend à ce que la fonction "handleClickIconEye" soit appelée
        expect(handleClickIconEye).toHaveBeenCalled();
      });
      expect($.fn.modal).toBeTruthy();
    });
  });
});

// test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate on to Bills page", () => {
    test("fetches bills from mock API GET", async () => {
      //Défini user comme employé dans le localStorage
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "a@a" })
      );
      //Simulation d'une navigation vers une page html.
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);

      //Le router injecte les pages dans le DOM
      router();

      //Fonction qui est dans le fichier app/Router.js,
      // elle aiguille les routes des fichiers js.
      window.onNavigate(ROUTES_PATH.Bills);

      //waitFor provient de la testing library.
      //Attend que la fonction soit appelée

      await waitFor(() => screen.getByTestId("tbody"));

      expect(bills).toBeTruthy();
    });
  });

  // Gestion erreur 404
  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
    });
    test("fetches bills from an API and fails with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"));
          },
        };
      });
      window.onNavigate(ROUTES_PATH.Dashboard);
      await new Promise(process.nextTick);
      //On s'attend à voir l'affichage de l'erreur 404.
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });
    //Gestion de l'erreur 500
    test("fetches messages from an API and fails with 500 message error", async () => {
      //mockImplementationOnce: Accepte une fonction qui sera utilisée comme une implémentation
      //de simulation pour un appel à la fonction simulée.
      //Peut être enchaîné de sorte que plusieurs appels de fonction produisent des résultats différents.
      //Ici on appelle la fonction list() de store.js et on simule le rejet de la promesse
      //Puis création d'un objet qui simule une erreur.
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });

      window.onNavigate(ROUTES_PATH.Dashboard);
      await new Promise(process.nextTick);
      //On s'attend à voir l'affichage de l'erreur 500.
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});

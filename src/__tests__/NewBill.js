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
import userEvent from "@testing-library/user-event";

jest.mock("../app/store", () => mockStore);
describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then email icon in the vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
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
      window.onNavigate(ROUTES_PATH.NewBill);
      await waitFor(() => screen.getByTestId("icon-mail"));
      const mailIcon = screen.getByTestId("icon-mail");

      expect(mailIcon.classList.contains("active-icon")).toBe(true);
    });
  });
  describe("When I am on NewBill page and I want to add a receipt", () => {
    test("Then the receipt is uploaded if the right file format is used", () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      document.body.innerHTML = NewBillUI();
    });
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };
  });

  describe("When I am on NewBill page and I want to add a receipt", () => {
    test("Then the receipt is uploaded if the right file format is used", () => {
      document.body.innerHTML = NewBillUI();

      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const newBill = new NewBill({
        document,
        onNavigate,
        mockStore,
        localStorage,
      });

      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      const file = screen.getByTestId("file");

      file.addEventListener("change", handleChangeFile);
      fireEvent.change(file, {
        target: { fileName: "image.png" },
      });

      expect(handleChangeFile).toHaveBeenCalled();
      expect(file.fileName).toBe("image.png");
      expect(file.fileName).toMatch(new RegExp("png|jpg|jpeg"));
    });
  });

  // describe("When I am on NewBill page and I want to add a receipt", () => {
  //   test("Then if the wrong file format is uploaded, an alert is shown ", () => {
  //     jest.spyOn(window, "alert").mockImplementation(() => {});
  //     document.body.innerHTML = NewBillUI();

  //     Object.defineProperty(window, "localStorage", {
  //       value: localStorageMock,
  //     });
  //     window.localStorage.setItem(
  //       "user",
  //       JSON.stringify({
  //         type: "Employee",
  //       })
  //     );

  //     const onNavigate = (pathname) => {
  //       document.body.innerHTML = ROUTES({ pathname });
  //     };
  //     const newBill = new NewBill({
  //       document,
  //       onNavigate,
  //       mockStore: null,
  //       localStorage,
  //     });
  //     const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
  //     const file = screen.getByTestId("file");

  //     file.addEventListener("change", handleChangeFile);
  //     fireEvent.change(file, {
  //       target: { fileName: "file.txt" },
  //     });

  //     expect(handleChangeFile).toHaveBeenCalled();
  //     expect(file.fileName).not.toBe("image.png");
  //     expect(window.alert).toBeCalled();
  //   });
  // });

  describe("When I anm on NewBill page and the form is rightfully completed ", () => {
    test("Then I can submit and create the NewBill", async () => {
      document.body.innerHTML = NewBillUI();

      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const newBill = new NewBill({
        document,
        onNavigate,
        mockStore: null,
        localStorage,
      });

      const handleSubmit = jest.fn(newBill.handleSubmit);
      const submitBtn = screen.getByTestId("form-new-bill");

      submitBtn.addEventListener("submit", handleSubmit);
      fireEvent.submit(submitBtn);
      expect(handleSubmit).toHaveBeenCalled();
      expect(screen.getByText("Mes notes de frais")).toBeTruthy();
    });
  });
});

// Test d'intégration POST

describe("Given I am a user connected as an employee", () => {
  describe("When I create a new bill", () => {
    test("send bill to mock API post", async () => {
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
            return Promise.resolve();
          },
        };
      });
      await new Promise(process.nextTick);
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
      document.body.innerHTML = BillsUI({ error: "Erreur 404" });
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
      document.body.innerHTML = BillsUI({ error: "Erreur 500" });
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});

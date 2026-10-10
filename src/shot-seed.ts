// TEMP-QA-SEED — DELETE AFTER QA. Not part of the product.
import {
  addBill,
  addContractor,
  addContractorPayment,
  addDonation,
  addExpense,
  addInvoice,
  addLoan,
  addLoanPayment,
  addService,
  addTrip,
  getBusinesses,
  getContractors,
  setActiveBusinessId,
  setInvoiceStatus,
  getInvoices,
} from "./db";

/** Seed realistic demo data for the most recently created business. */
export async function __seedDemo(kind: "biz" | "nfp"): Promise<void> {
  const list = await getBusinesses();
  const b = list[list.length - 1];
  if (!b) return;
  setActiveBusinessId(b.id);

  if (kind === "biz") {
    await addInvoice({ customer: "Downtown Café", amount: 1240, category: "catering-events", due_date: "2026-10-02", tax_rate: 0.07, pay_method: "transfer" });
    await addInvoice({ customer: "Rosa's Market", amount: 860, category: "takeout-delivery-sales", due_date: "2026-10-08", tax_rate: 0.07, pay_method: "card" });
    await addInvoice({ customer: "Office Park Deli", amount: 2150, category: "catering-events", due_date: "2026-10-18", tax_rate: 0.07 });
    await addInvoice({ customer: "Green Grocers", amount: 940, category: "takeout-delivery-sales", due_date: "2026-10-25", tax_rate: 0.07 });
    await addInvoice({ customer: "Sunrise Diner", amount: 620, category: "dine-in-sales", due_date: "2026-09-28", tax_rate: 0.07 });
    const invs = await getInvoices();
    for (const inv of invs) {
      if (inv.customer === "Downtown Café" || inv.customer === "Rosa's Market") {
        await setInvoiceStatus(inv.id, "paid");
      }
    }
    await addExpense({ description: "Flour and baking supplies", amount: 412.5, category: "food-supplies", date: "2026-10-06", pay_method: "card" });
    await addExpense({ description: "October rent", amount: 1800, category: "rent-lease", date: "2026-10-01", pay_method: "transfer" });
    await addExpense({ description: "Server wages — week 1", amount: 1120, category: "wages-servers", date: "2026-09-30", pay_method: "transfer" });
    await addExpense({ description: "Delivery app fees", amount: 86.2, category: "delivery-fees", date: "2026-10-07", pay_method: "card" });
    await addExpense({ description: "To-go boxes and cups", amount: 145.75, category: "disposables-packaging", date: "2026-10-05", pay_method: "card" });
    await addExpense({ description: "Oven repair", amount: 220, category: "equipment-repairs", date: "2026-10-03", pay_method: "cash" });
    await addExpense({ description: "Coffee and soft drinks", amount: 190.4, category: "beverages", date: "2026-09-28", pay_method: "card" });
    await addBill({ payee: "Sysco Foods", amount: 980, category: "food-supplies", due_date: "2026-10-20" });
    await addBill({ payee: "City Utilities", amount: 210, category: "rent-lease", due_date: "2026-10-08" });
    await addService({ name: "Sourdough loaf", price: 6 });
    await addService({ name: "Catering tray", price: 85 });
    await addService({ name: "Custom cake", price: 45 });
    await addTrip({ date: "2026-10-04", miles: 22, purpose: "Supply run to Restaurant Depot" });
    await addTrip({ date: "2026-10-07", miles: 14, purpose: "Catering delivery downtown" });
    await addContractor({ name: "Luis Mendoza", note: "Oven repair" });
    const cs = await getContractors();
    const luis = cs.find((c) => c.name === "Luis Mendoza");
    if (luis) {
      await addContractorPayment({ contractor_id: luis.id, amount: 350, date: "2026-09-15", note: "Oven fix" });
      await addContractorPayment({ contractor_id: luis.id, amount: 200, date: "2026-10-01", note: "Follow-up" });
    }
    const loanId = await addLoan({ name: "Oven loan — First Bank", borrowed_amount: 8000, date_borrowed: "2026-06-01", note: "" });
    if (loanId) {
      await addLoanPayment({ loan_id: loanId, amount: 400, date: "2026-09-01", note: "" });
      await addLoanPayment({ loan_id: loanId, amount: 400, date: "2026-10-01", note: "" });
    }
  } else {
    await addDonation({ donor: "Midwest Drywall Group", amount: 4000, date: "2026-10-02", campaign: "Thanksgiving meals" });
    await addDonation({ donor: "Garcia Family", amount: 250, date: "2026-10-05", campaign: "General fund" });
    await addDonation({ donor: "Avon Mexican Market", amount: 2000, date: "2026-09-28", campaign: "Thanksgiving meals" });
    await addDonation({ donor: "Anonymous", amount: 100, date: "2026-09-20", campaign: "General fund" });
    await addDonation({ donor: "Local Bakery Inc", amount: 500, date: "2026-09-15", campaign: "Youth program" });
    await addExpense({ description: "Holiday meal groceries", amount: 1200, category: "program-expenses", date: "2026-10-04", pay_method: "card" });
    await addExpense({ description: "Flyers for fundraiser", amount: 340, category: "fundraising-expenses", date: "2026-09-25", pay_method: "card" });
    await addExpense({ description: "Office rent October", amount: 600, category: "rent-utilities", date: "2026-10-01", pay_method: "transfer" });
  }
}

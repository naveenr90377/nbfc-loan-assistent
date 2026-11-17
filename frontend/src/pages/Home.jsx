
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Wallet,
  Heart,
  GraduationCap,
  Stethoscope,
  FileCheck,
  Calculator,
  Info,
} from 'lucide-react';

function Home() {
  const loans = [
    {
      name: 'Personal Loan',
      desc: 'For personal expenses and unexpected financial needs.',
      icon: Wallet,
    },
    {
      name: 'Wedding Loan',
      desc: 'Explore financing for wedding-related expenses.',
      icon: Heart,
    },
    {
      name: 'Medical Loan',
      desc: 'Understand funding options for healthcare expenses.',
      icon: Stethoscope,
    },
    {
      name: 'Education Loan',
      desc: 'Explore funding for courses and education.',
      icon: GraduationCap,
    },
  ];

  const steps = [
    'Choose your loan requirement and amount.',
    'Compare interest rates, APR, and additional charges.',
    'Check eligibility based on income and credit history.',
    'Submit your application and required documents.',
    'Complete lender verification.',
    'Review the loan agreement before accepting the offer.',
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900">

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-blue-600 font-semibold text-sm mb-4 uppercase">
            Understand. Compare. Borrow Responsibly.
          </p>

          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
            Make smarter loan decisions before you apply.
          </h1>

          <p className="text-slate-600 text-lg leading-relaxed mb-8">
            Learn how NBFC loans work, understand interest rates and
            charges, explore the application process, and get guidance
            from Asha, your AI loan assistant.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              to="/chat"
              className="bg-blue-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 flex items-center gap-2"
            >
              Ask Asha <ArrowRight size={18} />
            </Link>

            <a
              href="#loan-info"
              className="border border-slate-300 px-6 py-3 rounded-lg font-semibold hover:bg-slate-50"
            >
              Explore Loan Information
            </a>
          </div>

          <p className="text-xs text-slate-400 mt-5">
            Educational platform and simulated loan application demo.
          </p>
        </div>

        <div className="bg-blue-50 rounded-2xl p-8 border border-blue-100">
          <h2 className="text-2xl font-bold mb-6">
            Before taking a loan
          </h2>

          {[
            'Understand the interest rate.',
            'Calculate your monthly EMI.',
            'Check processing fees and other charges.',
            'Read the loan agreement carefully.',
          ].map((item, i) => (
            <div key={i} className="flex gap-3 mb-5">
              <FileCheck className="text-blue-700 flex-shrink-0" />
              <p className="text-slate-700">{item}</p>
            </div>
          ))}

          <p className="text-blue-900 font-semibold mt-5">
            A loan is a financial commitment, not additional income.
          </p>
        </div>
      </section>

      {/* Loan Categories */}
      <section id="loans" className="bg-slate-50 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Explore Loan Categories
          </h2>

          <p className="text-slate-600 text-center mb-10">
            Understand different borrowing requirements before applying.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {loans.map((loan) => {
              const Icon = loan.icon;

              return (
                <div
                  key={loan.name}
                  className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-md transition"
                >
                  <Icon className="text-blue-700 mb-4" size={28} />

                  <h3 className="font-bold text-lg mb-2">
                    {loan.name}
                  </h3>

                  <p className="text-sm text-slate-600 mb-5">
                    {loan.desc}
                  </p>

                  <Link
                    to="/chat"
                    className="text-blue-900 text-sm font-semibold flex items-center gap-2"
                  >
                    Check with Asha <ArrowRight size={15} />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Loan Information */}
      <section id="loan-info" className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold mb-4">
          Understand Your Loan Costs
        </h2>

        <p className="text-slate-600 mb-10 max-w-2xl">
          Don't compare loans using interest rates alone. Understand
          the complete cost before accepting an offer.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              title: 'Interest Rate',
              desc: 'The rate charged for borrowing money. Compare annual rates and how interest is calculated.',
            },
            {
              title: 'APR',
              desc: 'Annual Percentage Rate helps explain the overall annualized borrowing cost.',
            },
            {
              title: 'Processing Fee',
              desc: 'An application processing charge. Check applicable taxes and deductions.',
            },
            {
              title: 'EMI',
              desc: 'Your scheduled monthly repayment of principal and interest.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="border border-slate-200 rounded-xl p-5"
            >
              <h3 className="font-bold mb-3">{item.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-blue-50 p-6 rounded-xl flex gap-3">
          <Info className="text-blue-700 flex-shrink-0" />
          <p className="text-sm text-blue-900">
            In a reducing-balance loan, interest is calculated on the
            outstanding principal. As principal is repaid, the
            outstanding balance and interest component generally decrease.
          </p>
        </div>

        <div className="mt-8 border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-bold text-lg">EMI Calculator</h3>
            <p className="text-sm text-slate-600">
              Calculate monthly installments and total repayment.
            </p>
          </div>

          <span className="text-sm text-blue-700 font-semibold flex items-center gap-2">
            <Calculator size={18} /> Coming next
          </span>
        </div>
      </section>

      {/* Application Guide */}
      <section id="how-it-works" className="bg-slate-900 text-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            How to Apply for an NBFC Loan
          </h2>

          <p className="text-slate-300 text-center mb-10">
            A general overview of the application journey.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {steps.map((step, i) => (
              <div
                key={i}
                className="bg-slate-800 border border-slate-700 p-5 rounded-xl"
              >
                <p className="text-blue-400 font-bold text-sm mb-3">
                  STEP 0{i + 1}
                </p>
                <p className="text-sm text-slate-200">{step}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h3 className="font-bold text-xl mb-4">
              Common Documents Required
            </h3>

            <div className="grid sm:grid-cols-2 gap-3 text-sm text-slate-300">
              <p>• PAN card or accepted identity proof</p>
              <p>• Address proof</p>
              <p>• Salary slips or income proof</p>
              <p>• Bank statements, if requested</p>
              <p>• Employment or business details</p>
              <p>• Other lender-requested documents</p>
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-6 text-center">
            Requirements differ by lender and loan product.
          </p>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <p className="text-sm text-amber-900">
            <strong>Disclaimer:</strong> FinEase Capital is an
            educational and demonstration project, not an actual NBFC
            or registered lender. Rates, charges, and eligibility
            rules in the simulated application are illustrative.
            Actual loan terms and approvals depend on the relevant lender.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between gap-5">
          <div>
            <h3 className="text-white font-bold text-lg">
              FinEase Capital
            </h3>
            <p className="text-xs mt-2">
              Understand loans. Make informed decisions.
            </p>
          </div>

          <div className="flex flex-wrap gap-5 text-sm">
            <a href="#loans" className="hover:text-white">Loans</a>
            <a href="#loan-info" className="hover:text-white">Loan Costs</a>
            <a href="#how-it-works" className="hover:text-white">Application Guide</a>
            <Link to="/chat" className="hover:text-white">Ask Asha</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;

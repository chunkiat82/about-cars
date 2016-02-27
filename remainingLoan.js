// ES6
// const loan3Years = {loanAmount:100000, loanPeriod:120, interestRate:1.88, repaidPeriod: 36}; 
// const loan4Years =  Object.assign({}, loan3Years, {repaidPeriod: 48});

function getRemainingLoan ({loanAmount, loanPeriod, interestRate, repaidPeriod} = options) {
	const PENALTY = 0.2; //20%

	const totalMonths = loanPeriod; //120
	const interest = interestRate / 100; // 0.0188;
	const paidMonths = repaidPeriod;//60;

	const totalInterest = totalMonths/12 * interest * loanAmount;

	const total = loanAmount + totalInterest;

	const rebate = ((paidMonths * (paidMonths + 1)) / (totalMonths * (totalMonths + 1))) * totalInterest;

	const penalty = 0.2 * rebate;

	const monthlyPayment = total / totalMonths;

	const totalPayment = paidMonths * monthlyPayment;

	const remainingAmount = total - totalPayment - rebate + penalty;

	return remainingAmount;
}

// console.log(getRemainingLoan(loan3Years)-getRemainingLoan(loan4Years));

export default getRemainingLoan;
const { Metadata } = require('libphonenumber-js/core');
const metadata = require('libphonenumber-js/min/metadata');

const getMaxLength = (countryCode) => {
    if (!countryCode) return 15;
    try {
        const meta = new Metadata(metadata);
        meta.selectNumberingPlan(countryCode);
        if (meta.numberingPlan) {
            const lengths = meta.numberingPlan.possibleLengths();
            return { country: countryCode, lengths: lengths, max: Math.max(...lengths) };
        }
        return { country: countryCode, error: 'no plan', max: 15 };
    } catch (e) {
        return { country: countryCode, error: e.message, max: 15 };
    }
}

const countries = ['IN', 'AF', 'US', 'GB', 'IT', 'FR', 'DE'];
countries.forEach(c => console.log(getMaxLength(c)));

"""
Centralized master data constants for the WinVinaya CRM.
These should match the values used in the frontend dropdowns.
"""

DISABILITY_TYPES = [
    "Blindness",
    "Low Vision",
    "Leprosy Cured Persons",
    "Hearing Impairment (Deaf and Hard of Hearing)",
    "Locomotor Disability",
    "Dwarfism",
    "Intellectual Disability",
    "Mental Illness",
    "Autism Spectrum Disorder",
    "Cerebral Palsy",
    "Muscular Dystrophy",
    "Chronic Neurological Conditions",
    "Specific Learning Disabilities",
    "Multiple Sclerosis",
    "Speech and Language Disability",
    "Thalassemia",
    "Hemophilia",
    "Sickle Cell Disease",
    "Multiple Disabilities (including deaf-blindness)",
    "Acid Attack Survivor",
    "Parkinson's Disease",
    "Women",
    "Other"
]

QUALIFICATIONS = [
    "Any Graduation",
    "B.Tech",
    "B.E",
    "B.Sc",
    "B.Com",
    "B.A",
    "B.B.A",
    "B.C.A",
    "M.Tech",
    "M.E",
    "M.Sc",
    "M.Com",
    "M.A",
    "M.B.A",
    "M.C.A",
    "Ph.D",
    "Diploma",
    "Other"
]

# Common city mappings to match 'country-state-city' canonical names
CITY_CANONICAL_MAPPINGS = {
    "bangalore": "Bengaluru",
    "bombay": "Mumbai",
    "calcutta": "Kolkata",
    "madras": "Chennai",
    "gurgaon": "Gurugram",
    "pondicherry": "Puducherry",
    "trichy": "Tiruchirappalli",
    "cochin": "Kochi",
    "banaras": "Varanasi",
    "mysore": "Mysuru",
    "mangalore": "Mangaluru",
    "belgaum": "Belagavi",
    "hubli": "Hubballi",
    "gulbarga": "Kalaburagi"
}

COMMON_SKILLS = [
    "Java", "Python", "JavaScript", "React", "Angular", "Node.js", "SQL", "NoSQL",
    "C++", "C#", ".NET", "HTML/CSS", "AWS", "Azure", "GCP", "Data Analytics",
    "Soft Skills", "Communication", "Customer Support", "BPO", "Accounting",
    "Tally", "Excel", "Data Entry", "Project Management", "Agile", "Salesforce",
    "RPA", "Power Automate"
]

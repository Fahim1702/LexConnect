import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="mt-16 bg-slate-900 py-10 text-white">

            <div className="container-page grid gap-8 md:grid-cols-3">

                <div>
                    <h2 className="text-xl font-bold">
                        LexConnect
                    </h2>

                    <p className="mt-3 text-sm text-gray-300">
                        Connecting people with legal services and lawyers in Bangladesh.
                    </p>
                </div>

                <div>
                    <h3 className="font-semibold">
                        Quick Links
                    </h3>

                    <div className="mt-3 flex flex-col gap-2 text-sm">
                        <Link to="/services">
                            Services
                        </Link>

                        <Link to="/lawyers">
                            Lawyers
                        </Link>

                        <Link to="/faq">
                            FAQ
                        </Link>
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold">
                        Disclaimer
                    </h3>

                    <p className="mt-3 text-sm text-gray-300">
                        This project is for demonstration and educational purposes.
                        Information shown here should not be considered legal advice.
                    </p>
                </div>

            </div>

            <div className="container-page mt-8 border-t border-gray-700 pt-5 text-sm text-gray-400">
                © {new Date().getFullYear()} LexConnect
            </div>

        </footer>
    );
}
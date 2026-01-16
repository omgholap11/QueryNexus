import React from 'react';

export default function Header() {
    return (
        <header className="flex items-center justify-end px-8 py-4 sticky top-0 z-10 pl-14 md:pl-8">
            <div className="flex items-center gap-3 cursor-pointer group">
                <div className="size-9 rounded-full border-2 border-primary/20 p-0.5 group-hover:border-primary transition-all">
                    <div className="w-full h-full rounded-full bg-center bg-cover" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBczn6B3s2lnzvSjMKqMnoIrJqw4rVu5YBtZCo9H3vgmlCJ3crte00T3j-DDVxO2Nwi722bAobyoYlcnP_6rIswHnxwO_4FeOgMKVF7dP0Uv5Mxc0tvBginrk5oQXYR9YZxprHEVVN26-Ip4OT-vktlwHRK5XfnJwnTrp_RZYgfCOhZvFhSG2yzUx6p9aVs9dYpod2ilCC4Xgi2kOwf_h6VoGXEOPb7RzIKUvnw3qkZ6BeiZV0ft-MYOptGuYNhTmow38d1oHEWdfzP')" }}></div>
                </div>
            </div>
        </header>
    );
}

const Table = ({ children }) => {
  return (
    <div className="overflow-x-auto bg-gray-600 border-2 border-black">
      <table className="min-w-full border-collapse border border-gray-300">
        {children}
      </table>
    </div>
  );
};

const Thead = ({ children }) => {
  return <thead className="bg-black text-white">{children}</thead>;
};

const Tbody = ({ children }) => {
  return <tbody>{children}</tbody>;
};

const Tr = ({ children }) => {
  return <tr className="border-b border-gray-300">{children}</tr>;
};

const Th = ({ children }) => {
  return (
    <th className="px-4 py-2 text-left font-semibold border border-gray-300">
      {children}
    </th>
  );
};

const Td = ({ children, className = "" }) => {
  return (
    <td className={`px-4 py-2 border border-gray-300 ${className}`}>
      {children}
    </td>
  );
};

export { Table, Thead, Tbody, Tr, Th, Td };

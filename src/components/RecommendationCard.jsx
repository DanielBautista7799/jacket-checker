function RecommendationCard({ recommendation }) {
if (!recommendation) return null;

return (
<div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-5">
<h3 className="mb-2 text-lg font-semibold text-white">Recommendation</h3>
<p className="text-slate-200">{recommendation}</p>
</div>
);
}

export default RecommendationCard;